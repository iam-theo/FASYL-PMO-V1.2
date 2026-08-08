/**
 * List-query types.
 *
 * The API exposes no query parameters — `GET /reports` returns everything.
 * Search, filter, sort and pagination therefore run client-side, isolated in
 * `utils/reportQuery.js`. See that file for the migration path to server-side.
 */

/**
 * @typedef {'title'|'type'|'format'|'projectId'|'generatedAt'|'periodStart'|'periodEnd'} ReportSortField
 */

/**
 * @typedef {'asc'|'desc'} SortDirection
 */

/**
 * @typedef {object} ReportFilters
 * @property {string} search        Free text, matched against title/description/file name.
 * @property {string|null} projectId
 * @property {number|null} stageId
 * @property {ReportType[]} types
 * @property {ReportFormat[]} formats
 * @property {IsoDateString|null} generatedFrom
 * @property {IsoDateString|null} generatedTo
 */

/**
 * @typedef {object} ReportSort
 * @property {ReportSortField} field
 * @property {SortDirection} direction
 */

/**
 * @typedef {object} ReportQuery
 * @property {ReportFilters} filters
 * @property {ReportSort} sort
 * @property {number} page          1-based.
 * @property {number} pageSize
 */

/**
 * @template TItem
 * @typedef {object} Paginated
 * @property {TItem[]} items        The current page.
 * @property {number} total         Rows after filtering, before pagination.
 * @property {number} page
 * @property {number} pageSize
 * @property {number} pageCount
 */

export {};
