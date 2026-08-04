import { useEffect, useRef } from "react";

/**
 * Singleton WebSocket client for realtime server-push events.
 *
 * Usage:
 *   import { startRealtime, stopRealtime, useRealtimeEvent } from "./realtime";
 *
 *   // In App or MainBody mount:
 *   startRealtime(() => localStorage.getItem("token"));
 *
 *   // In any component:
 *   useRealtimeEvent("notification", (payload) => { ... });
 */

/* -------------------------------------------------------------------------- */
/* URL derivation                                                              */
/* -------------------------------------------------------------------------- */

const WS_URL = (() => {
  const override = import.meta.env.VITE_WS_URL;
  if (override) return override;

  const api =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

  try {
    const url = new URL(api);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/ws`;
  } catch {
    return "ws://localhost:5000/ws";
  }
})();

/* -------------------------------------------------------------------------- */
/* Connection state                                                            */
/* -------------------------------------------------------------------------- */

let socket = null;
let getToken = null;
let shouldReconnect = false;
let reconnectTimer = null;
let currentDelay = 1000;

const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

const listeners = new Set();

const notify = (event, payload) => {
  for (const listener of listeners) {
    try {
      listener(event, payload);
    } catch {
      /* subscriber threw — keep others alive */
    }
  }
};

const scheduleReconnect = () => {
  if (!shouldReconnect || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, currentDelay);
  currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
};

const connect = () => {
  if (socket && socket.readyState <= window.WebSocket.OPEN) return;

  const token = typeof getToken === "function" ? getToken() : null;
  if (!token) {
    scheduleReconnect();
    return;
  }

  const ws = new window.WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

  ws.onopen = () => {
    currentDelay = BASE_DELAY;
  };

  ws.onmessage = (event) => {
    try {
      const { event: eventName, payload } = JSON.parse(event.data);
      if (eventName) notify(eventName, payload);
    } catch {
      /* ignore unparseable frames */
    }
  };

  ws.onclose = (event) => {
    socket = null;
    if (event.code === 4401) {
      shouldReconnect = false;
      return;
    }
    scheduleReconnect();
  };

  ws.onerror = () => {
    /* onclose fires immediately after — reconnect logic lives there */
  };

  socket = ws;
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Start the realtime connection. Idempotent — safe to call multiple times.
 */
export const startRealtime = (getAuthToken) => {
  if (shouldReconnect) return;
  getToken = getAuthToken;
  shouldReconnect = true;
  connect();
};

/**
 * Stop the realtime connection and cancel pending reconnects.
 */
export const stopRealtime = () => {
  shouldReconnect = false;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  currentDelay = BASE_DELAY;
  if (socket) {
    try {
      socket.close();
    } catch {
      /* noop */
    }
    socket = null;
  }
};

/**
 * Subscribe to a specific realtime event. Returns an unsubscribe function.
 */
export const subscribeRealtime = (event, handler) => {
  const listener = (eventName, payload) => {
    if (eventName === event) handler(payload);
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/* -------------------------------------------------------------------------- */
/* React hook                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fires `handler` whenever a specific realtime event arrives.
 * Reconnects automatically; missing events are caught up via the server's
 * "connected" event, which re-triggers any `connected` subscription.
 */
export const useRealtimeEvent = (event, handler) => {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    return subscribeRealtime(event, (payload) => {
      savedHandler.current(payload);
    });
  }, [event]);
};
