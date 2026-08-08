/**
 * Module-level configuration. Every value is overridable by the host PMO app
 * through `configureReportsApi()` so the module can be dropped into an
 * existing shell without editing its source.
 */

export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export const API_TIMEOUT_MS = Number(import.meta.env?.VITE_API_TIMEOUT_MS ?? 20000);

/**
 * Route prefix the module is mounted under inside the host app.
 *
 * Reports render inside MainBody's shell (sidebar + header), so they live under
 * `/app`. Every link, redirect and breadcrumb in the module is derived from
 * this — changing it here moves the whole module.
 */
export const REPORTS_BASE_PATH = '/app/reports';

/** Toast auto-dismiss timings, in ms. */
export const TOAST_DURATION = {
  success: 4000,
  error: 6000,
  info: 4000,
};

/** How long a fetched list stays fresh before a background refetch. */
export const LIST_STALE_TIME_MS = 30_000;

/** Debounce applied to the search box before the query re-runs. */
export const SEARCH_DEBOUNCE_MS = 250;
