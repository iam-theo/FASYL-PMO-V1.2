import { REPORT_TYPE_VALUES, REPORT_FORMAT_VALUES } from './report.constants';

export const SORT_DIRECTION = Object.freeze({ asc: 'asc', desc: 'desc' });

/** Columns the table can sort by, with the labels used in the header. */
export const REPORT_SORT_FIELDS = Object.freeze({
  title: 'Title',
  type: 'Type',
  format: 'Format',
  projectId: 'Project',
  generatedAt: 'Generated',
  periodStart: 'Period start',
  periodEnd: 'Period end',
});

export const PAGE_SIZE_OPTIONS = Object.freeze([10, 25, 50, 100]);
export const DEFAULT_PAGE_SIZE = 25;

/** @type {import('../types').ReportFilters} */
export const DEFAULT_REPORT_FILTERS = Object.freeze({
  search: '',
  projectId: null,
  stageId: null,
  types: [],
  formats: [],
  generatedFrom: null,
  generatedTo: null,
});

/** @type {import('../types').ReportSort} */
export const DEFAULT_REPORT_SORT = Object.freeze({
  field: 'generatedAt',
  direction: SORT_DIRECTION.desc,
});

/** @type {import('../types').ReportQuery} */
export const DEFAULT_REPORT_QUERY = Object.freeze({
  filters: DEFAULT_REPORT_FILTERS,
  sort: DEFAULT_REPORT_SORT,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
});

/** Guards against junk arriving from the URL query string. */
export const ALLOWED_FILTER_VALUES = Object.freeze({
  types: REPORT_TYPE_VALUES,
  formats: REPORT_FORMAT_VALUES,
});

/** Fields scanned by the free-text search box. */
export const SEARCHABLE_REPORT_FIELDS = Object.freeze([
  'title',
  'description',
  'fileName',
  'projectId',
]);
