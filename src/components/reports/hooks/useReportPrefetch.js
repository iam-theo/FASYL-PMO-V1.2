import { useCallback, useRef } from 'react';
import { reportService } from '../services/reportService';

/**
 * Warms a report's cache entry before the user commits to opening it.
 *
 * Wired to `mouseenter` and `focus` on table rows and cards: by the time a
 * click lands, the detail page usually has its data and renders with no loading
 * state. A miss costs nothing — the page fetches as it always would.
 *
 * Fired ids are remembered for the life of the component so dragging the
 * pointer across a table does not queue one request per row per pass.
 */
export const useReportPrefetch = () => {
  const requested = useRef(new Set());

  return useCallback((reportOrId) => {
    const id = typeof reportOrId === 'object' ? reportOrId?.id : reportOrId;
    if (!id || requested.current.has(id)) return;

    requested.current.add(id);
    reportService.prefetchReport(id);
  }, []);
};
