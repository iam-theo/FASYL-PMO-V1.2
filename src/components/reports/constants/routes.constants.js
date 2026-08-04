import { REPORTS_BASE_PATH } from './config.constants';

/**
 * Route paths, built in one place.
 *
 * `paths` are absolute (for `navigate()` and `<Link to>`), `segments` are the
 * relative patterns the router registers. Keeping both here means remounting
 * the module at `/analytics/reports` is a one-line change in
 * `config.constants.js` — no page needs editing.
 */
export const REPORTS_ROUTES = Object.freeze({
  list: () => REPORTS_BASE_PATH,
  create: () => `${REPORTS_BASE_PATH}/new`,
  details: (id) => `${REPORTS_BASE_PATH}/${id}`,
  edit: (id) => `${REPORTS_BASE_PATH}/${id}/edit`,
});

export const REPORTS_ROUTE_SEGMENTS = Object.freeze({
  list: '',
  create: 'new',
  details: ':reportId',
  edit: ':reportId/edit',
});

/** Query-string keys for list state. Short, because they end up in shared URLs. */
export const QUERY_PARAM_KEYS = Object.freeze({
  search: 'q',
  projectId: 'project',
  stageId: 'stage',
  types: 'type',
  formats: 'format',
  generatedFrom: 'from',
  generatedTo: 'to',
  sortField: 'sort',
  sortDirection: 'dir',
  page: 'page',
  pageSize: 'size',
});
