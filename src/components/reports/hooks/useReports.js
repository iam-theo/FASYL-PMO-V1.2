import { useCallback } from 'react';
import { CACHE_KEYS } from '../constants/cache.constants';
import { reportService } from '../services/reportService';
import { compareIds } from '../utils/normalize';
import { useAsyncResource } from './useAsyncResource';

/**
 * The reports list, joined with project and stage names.
 *
 * Also exposes the three cache writes the list page needs for optimistic
 * updates. They live here rather than in the page because "what the list looks
 * like after a delete" is module knowledge, not page knowledge.
 */
export const useReports = () => {
  const fetchReports = useCallback(
    ({ force }) => reportService.getReportsWithContext({ force }),
    [],
  );

  const { data, error, isLoading, isValidating, refetch, setData } = useAsyncResource(
    fetchReports,
    { initialData: [], cacheKey: CACHE_KEYS.reportsList() },
  );

  const reports = data ?? [];

  const removeLocal = useCallback(
    (id) => setData((current) => (current ?? []).filter((report) => report.id !== id)),
    [setData],
  );

  const restoreLocal = useCallback(
    (report) =>
      setData((current) => {
        const next = [...(current ?? []), report];
        // Keep id order so a rolled-back row lands where it was, not at the end.
        return next.sort((a, b) => compareIds(a.id, b.id));
      }),
    [setData],
  );

  const upsertLocal = useCallback(
    (report) =>
      setData((current) => {
        const list = current ?? [];
        const index = list.findIndex((entry) => entry.id === report.id);
        if (index === -1) return [report, ...list];
        const next = [...list];
        next[index] = { ...next[index], ...report };
        return next;
      }),
    [setData],
  );

  return {
    reports,
    error,
    isLoading,
    isValidating,
    refetch,
    removeLocal,
    restoreLocal,
    upsertLocal,
  };
};
