import { LIST_STALE_TIME_MS } from './config.constants';

/**
 * Cache keys, built in one place so a page and a service can never disagree
 * about what a piece of data is called. Prefixes are meaningful:
 * `invalidate('reports:')` clears every report entry at once.
 */
export const CACHE_KEYS = Object.freeze({
  reportsList: () => 'reports:list',
  report: (id) => `reports:item:${id}`,
  projectsList: () => 'projects:list',
  project: (id) => `projects:item:${id}`,
});

export const CACHE_PREFIXES = Object.freeze({
  reports: 'reports:',
  projects: 'projects:',
});

/**
 * How long a response is served without revalidating.
 *
 * Projects live longer than reports because they change on a different clock —
 * a PMO adds a project a week, but reports are generated daily.
 */
export const CACHE_TTL = Object.freeze({
  reports: LIST_STALE_TIME_MS,
  projects: 5 * 60 * 1000,
});
