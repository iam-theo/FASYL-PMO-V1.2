import { useCallback } from 'react';
import { CACHE_KEYS } from '../constants/cache.constants';
import { reportService } from '../services/reportService';
import { toEntityId } from '../utils/normalize';
import { useAsyncResource } from './useAsyncResource';

/**
 * A single report by id.
 *
 * The id arrives from the URL as a string; it is coerced once here so neither
 * the page nor the service has to think about it again. A non-numeric id
 * disables the fetch rather than sending a request that can only 404.
 *
 * Navigating from a prefetched row renders with no loading state at all.
 */
export const useReport = (reportId) => {
  // Ids may be numeric or opaque strings, so normalise rather than coerce —
  // `Number('c1x9…')` is NaN, which would disable the fetch on a valid report.
  const id = toEntityId(reportId);
  const isValidId = id !== null;

  const fetchReport = useCallback(
    ({ force }) => reportService.getReportById(id, { force }),
    [id],
  );

  const { data, error, isLoading, isValidating, refetch, setData } = useAsyncResource(
    fetchReport,
    {
      deps: [id],
      enabled: isValidId,
      cacheKey: isValidId ? CACHE_KEYS.report(id) : null,
    },
  );

  return {
    report: data,
    error,
    isLoading: isValidId ? isLoading : false,
    isValidating,
    isInvalidId: !isValidId,
    refetch,
    setReport: setData,
  };
};
