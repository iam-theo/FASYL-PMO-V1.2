import Redis from "ioredis";

/**
 * Cross-instance fan-out for the realtime hub.
 *
 * On a persistent host (VPS/pm2) a single process holds every WebSocket, so
 * `clients` alone is enough. On serverless (Vercel) connections get pinned to
 * whatever Function instance accepted them, so two users can live on different
 * instances and a plain in-memory map can never reach both.
 *
 * This module bridges that gap with Redis pub/sub:
 *  - `startPubSub()` subscribes one connection to a channel. Every active
 *    Function instance runs it, so each instance relays remote events to its
 *    own local sockets.
 *  - `publishEvent()` pushes `{ userId, event, payload }` onto the channel.
 *    Redis delivers it to every instance (including the publisher's own
 *    subscriber), so there is exactly one delivery path.
 *
 * When `REDIS_URL` is unset the module stays inert and the realtime service
 * falls back to in-memory-only delivery (fine for a single instance / local
 * dev). Publishing never throws — if Redis is down events are dropped rather
 * than breaking the workflow that triggered them.
 */

const CHANNEL = "pmo:realtime";

let subscriber = null;
let publisher = null;
let initialized = false;
let onRemoteEvent = null;

export const isPubSubActive = () => initialized;

/** The realtime service registers a callback that delivers to local sockets. */
export const setRemoteEventHandler = (handler) => {
  onRemoteEvent = handler;
};

/** Attaches the Redis subscriber. Called once from setupRealtime. */
export const startPubSub = () => {
  if (!process.env.REDIS_URL || initialized) return;
  initialized = true;

  const opts = { maxRetriesPerRequest: null };

  subscriber = new Redis(process.env.REDIS_URL, opts);
  publisher = new Redis(process.env.REDIS_URL, opts);

  subscriber.on("message", (channel, message) => {
    if (channel !== CHANNEL || !onRemoteEvent) return;
    try {
      onRemoteEvent(JSON.parse(message));
    } catch {
      // Ignore malformed frames.
    }
  });

  subscriber.on("error", (err) =>
    console.error("Redis subscriber error:", err.message)
  );
  publisher.on("error", (err) =>
    console.error("Redis publisher error:", err.message)
  );

  subscriber.subscribe(CHANNEL, (err) => {
    if (err) console.error("Redis subscribe failed:", err.message);
  });
};

/**
 * Publishes an event to every active function instance. The subscriber on the
 * same instance delivers to local sockets, so callers never double-send.
 */
export const publishEvent = ({ userId, event, payload }) => {
  if (!initialized || !publisher) return;
  publisher
    .publish(CHANNEL, JSON.stringify({ userId, event, payload }))
    .catch(() => {});
};

/** Disconnects Redis. Used by the graceful shutdown path. */
export const stopPubSub = () => {
  if (subscriber) subscriber.disconnect();
  if (publisher) publisher.disconnect();
  subscriber = null;
  publisher = null;
  initialized = false;
  onRemoteEvent = null;
};
