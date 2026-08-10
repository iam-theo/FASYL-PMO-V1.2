import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import {
  isPubSubActive,
  publishEvent,
  setRemoteEventHandler,
  startPubSub,
  stopPubSub,
} from "./redis.pubsub.js";

/**
 * Realtime hub for push events (notifications, project refreshes, ...).
 *
 * A single WebSocketServer is attached to the HTTP server on the `/ws` path.
 * Clients authenticate with `?token=<access token>` in the URL (browser
 * WebSocket API cannot set headers), then register under their user id so
 * events can be routed per recipient.
 *
 * Delivery goes through Redis pub/sub when `REDIS_URL` is set so events reach
 * sockets on any serverless instance. Without Redis it degrades to a
 * same-process in-memory hub.
 */

/** userId -> Set<WebSocket> */
const clients = new Map();

const heartbeatInterval = 30000;

const send = (socket, event, payload) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify({ event, payload }));
  }
};

const getUserId = (decoded) =>
  decoded?.userId ?? decoded?.id ?? decoded?.sub ?? null;

const register = (userId, socket) => {
  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  set.add(socket);
};

const unregister = (userId, socket) => {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) clients.delete(userId);
};

/** Delivers an event to every socket of one user on this instance. */
const deliverToUser = (userId, event, payload) => {
  if (userId == null) return;
  const set = clients.get(Number(userId));
  if (!set) return;
  for (const socket of set) send(socket, event, payload);
};

/** Delivers an event to every connected socket on this instance. */
const broadcastLocally = (event, payload) => {
  for (const set of clients.values()) {
    for (const socket of set) send(socket, event, payload);
  }
};

/** Handles an event arriving over the Redis channel. */
const handleRemoteEvent = ({ userId, event, payload }) => {
  if (userId == null) {
    broadcastLocally(event, payload);
  } else {
    deliverToUser(userId, event, payload);
  }
};

/**
 * Sends an event to every socket of one user. Safe to call from any service —
 * it no-ops when the user has no live connection. With Redis configured the
 * subscriber on this instance delivers the message; otherwise it is delivered
 * directly from here.
 */
export const sendToUser = (userId, event, payload) => {
  if (userId == null) return;
  if (isPubSubActive()) {
    publishEvent({ userId, event, payload });
  } else {
    deliverToUser(userId, event, payload);
  }
};

/**
 * Sends an event to every connected user (across all instances when Redis is
 * configured).
 */
export const broadcast = (event, payload) => {
  if (isPubSubActive()) {
    publishEvent({ userId: null, event, payload });
  } else {
    broadcastLocally(event, payload);
  }
};

/**
 * Attaches the WebSocketServer to an existing HTTP server. Call once, right
 * after the server is created. Starts the Redis subscriber for cross-instance
 * fan-out.
 */
export const setupRealtime = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  setRemoteEventHandler(handleRemoteEvent);
  startPubSub();

  wss.on("connection", (socket, request) => {
    let userId = null;

    try {
      const url = new URL(request.url, "http://localhost");
      const token = url.searchParams.get("token");

      if (!token) throw new Error("Missing token");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = getUserId(decoded);

      if (!userId) throw new Error("Invalid token payload");
    } catch {
      socket.close(4401, "Unauthorized");
      return;
    }

    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    register(userId, socket);
    send(socket, "connected", { userId });

    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message?.event === "ping") {
          socket.send(JSON.stringify({ event: "pong" }));
        }
      } catch {
        // Ignore malformed frames.
      }
    });

    socket.on("close", () => unregister(userId, socket));
    socket.on("error", () => unregister(userId, socket));
  });

  const interval = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, heartbeatInterval);

  wss.on("close", () => clearInterval(interval));

  return wss;
};

/** Stops the WebSocketServer's heartbeat and disconnects Redis. */
export const stopRealtime = () => {
  stopPubSub();
};
