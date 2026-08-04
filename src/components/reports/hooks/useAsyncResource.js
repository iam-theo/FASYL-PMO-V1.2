import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toApiError } from '../utils/apiError';
import { requestCache } from '../utils/requestCache';

/**
 * The fetching primitive every data hook in the module is built on.
 *
 * It exists so four pages do not each hand-roll the same four bugs: setting
 * state after unmount, treating an abort as a failure, losing the previous data
 * on refetch (which makes tables flash empty), and showing a skeleton for data
 * that is already in memory.
 *
 * STALE-WHILE-REVALIDATE: when `cacheKey` names a fresh cache entry, the hook
 * renders it on the first commit — no loading state at all — and revalidates in
 * the background, reported through `isValidating` rather than `isLoading`. That
 * is what makes list → details → back feel instant.
 *
 * @param {(options: { signal: AbortSignal, force: boolean }) => Promise<any>} fetcher
 * @param {{
 *   deps?: any[],
 *   enabled?: boolean,
 *   initialData?: any,
 *   cacheKey?: string|null,
 *   select?: (data: any) => any,
 * }} [options]
 */
export const useAsyncResource = (
  fetcher,
  { deps = [], enabled = true, initialData = null, cacheKey = null, select = null } = {},
) => {
  // Read synchronously during the first render so cached data paints at once.
  const cached = enabled && cacheKey ? requestCache.peek(cacheKey) : undefined;

  const [data, setData] = useState(cached !== undefined ? cached : initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled && cached === undefined);
  const [isValidating, setIsValidating] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Held in refs so inline arrow functions do not retrigger the effect.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const selectRef = useRef(select);
  selectRef.current = select;

  /** Forces a network round trip, bypassing the cache. */
  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isCurrent = true;

    const hasCached = cacheKey ? requestCache.peek(cacheKey) !== undefined : false;
    // Showing a skeleton over data we already have is a downgrade, so an
    // already-populated view revalidates quietly instead.
    if (hasCached) setIsValidating(true);
    else setIsLoading(true);
    setError(null);

    fetcherRef
      .current({ signal: controller.signal, force: reloadToken > 0 })
      .then((result) => {
        if (!isCurrent) return;
        setData(result);
        setError(null);
      })
      .catch((caught) => {
        if (!isCurrent) return;
        const apiError = toApiError(caught);
        // An abort is us navigating away, not a failure worth showing.
        if (apiError.isCanceled) return;
        setError(apiError);
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsLoading(false);
        setIsValidating(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadToken, cacheKey, ...deps]);

  // `select` narrows cached data without giving it a second cache entry — the
  // project detail and its stage list are one request, read two ways.
  const value = useMemo(() => (select ? select(data) : data), [data, select]);

  return { data: value, error, isLoading, isValidating, refetch, setData };
};
