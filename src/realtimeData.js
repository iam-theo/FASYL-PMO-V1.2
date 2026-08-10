import { useEffect, useRef } from "react";
import { subscribeRealtime } from "./realtime";

/**
 * Per-module realtime data refresh.
 *
 * The backend broadcasts a generic `data:changed` event (from the audit
 * middleware, so every successful mutating request is covered) with a `module`
 * tag. Components subscribe with `useRealtimeModule("Projects", refetch)` and
 * their refetch runs whenever that module changes — debounced so a burst of
 * events (e.g. the sales sync) triggers a single refresh.
 *
 * Pass "*" to react to changes in every module.
 */

const HANDLERS = new Map(); // module -> Set<handler ref>
const DEBOUNCE = new Map(); // module -> timeout id
const DEBOUNCE_MS = 300;
const ALL = "*";

const run = (module, payload) => {
  const set = HANDLERS.get(module);
  if (!set || set.size === 0) return;

  clearTimeout(DEBOUNCE.get(module));
  DEBOUNCE.set(
    module,
    setTimeout(() => {
      DEBOUNCE.delete(module);
      for (const ref of set) {
        try {
          ref.current(payload);
        } catch {
          /* subscriber threw — keep others alive */
        }
      }
    }, DEBOUNCE_MS),
  );
};

subscribeRealtime("data:changed", ({ module, action, projectId, userId }) => {
  const payload = { action, projectId, userId };
  run(module, payload);
  run(ALL, payload);
});

/**
 * Runs `handler` whenever data belonging to `module` changes elsewhere.
 * Handlers are invoked with `{ action, projectId, userId }` so components can
 * decide whether the change concerns them.
 */
export const useRealtimeModule = (module, handler) => {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const set = HANDLERS.get(module) || new Set();
    set.add(ref);
    HANDLERS.set(module, set);

    return () => {
      set.delete(ref);
      if (set.size === 0) {
        HANDLERS.delete(module);
        const timer = DEBOUNCE.get(module);
        if (timer) {
          clearTimeout(timer);
          DEBOUNCE.delete(module);
        }
      }
    };
  }, [module]);
};
