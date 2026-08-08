/**
 * A small read-through cache with in-flight de-duplication.
 *
 * WHAT IT SOLVES: without it, navigating list → details → back refetches the
 * whole list, and the form's project select refetches on every visit. With it,
 * those are instant and the network is quiet.
 *
 * WHAT IT IS NOT: a replacement for TanStack Query. There is no background
 * refetch on window focus, no retry policy, no garbage collection. It is
 * roughly 60 lines because that is all this module's access patterns need — if
 * the PMO app later adopts a query library app-wide, `read` is the single
 * function to swap out.
 *
 * ABORT TRADE-OFF: a de-duplicated request deliberately does NOT receive the
 * caller's AbortSignal. Two components can share one in-flight promise, so
 * honouring one caller's abort would cancel the other's data — and in React
 * StrictMode the double-mount would abort the request it is about to await.
 * Consumers ignore late results instead (see `useAsyncResource`), and the
 * response still warms the cache rather than being thrown away.
 */

/** @type {Map<string, { data: unknown, expiresAt: number }>} */
const entries = new Map();

/** @type {Map<string, Promise<unknown>>} */
const inFlight = new Map();

const DEFAULT_TTL_MS = 30_000;

export const requestCache = {
  /**
   * Synchronous read of fresh data, or `undefined`. Used to render immediately
   * on mount instead of flashing a skeleton for data already in memory.
   */
  peek(key) {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      entries.delete(key);
      return undefined;
    }
    return entry.data;
  },

  /**
   * @param {string} key
   * @param {() => Promise<any>} loader
   * @param {{ ttl?: number, force?: boolean }} [options]
   */
  read(key, loader, { ttl = DEFAULT_TTL_MS, force = false } = {}) {
    if (!force) {
      const fresh = this.peek(key);
      if (fresh !== undefined) return Promise.resolve(fresh);

      const pending = inFlight.get(key);
      if (pending) return pending;
    }

    const promise = loader()
      .then((data) => {
        // Nothing is never a result worth caching — a null/undefined payload
        // (e.g. a detail fetch with no id) must not stick under a `…:null` key.
        if (data !== null && data !== undefined) {
          entries.set(key, { data, expiresAt: Date.now() + ttl });
        }
        inFlight.delete(key);
        return data;
      })
      .catch((error) => {
        // A failure must not be cached as a result, or a transient 500 would
        // stick around for the whole TTL.
        inFlight.delete(key);
        throw error;
      });

    inFlight.set(key, promise);
    return promise;
  },

  /** Writes a known-good value, e.g. the response body of a PATCH. */
  write(key, data, ttl = DEFAULT_TTL_MS) {
    if (data === null || data === undefined) return;
    entries.set(key, { data, expiresAt: Date.now() + ttl });
  },

  /** Drops an exact key, or every key starting with it. */
  invalidate(keyOrPrefix) {
    if (entries.delete(keyOrPrefix)) {
      inFlight.delete(keyOrPrefix);
      return;
    }
    for (const key of [...entries.keys()]) {
      if (key.startsWith(keyOrPrefix)) entries.delete(key);
    }
    for (const key of [...inFlight.keys()]) {
      if (key.startsWith(keyOrPrefix)) inFlight.delete(key);
    }
  },

  /** Call on sign-out — cached data belongs to the session that fetched it. */
  clear() {
    entries.clear();
    inFlight.clear();
  },
};
