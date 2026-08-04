import {
  DEFAULT_REPORT_QUERY,
  SEARCHABLE_REPORT_FIELDS,
  SORT_DIRECTION,
} from '../constants';
import { isWithinRange, toTimestamp } from './date';
import { compareIds, toArray, toSearchToken } from './normalize';

/**
 * Client-side search / filter / sort / paginate.
 *
 * WHY THIS EXISTS: the supplied API has no query parameters — `GET /reports`
 * returns the full collection. Rather than scatter `.filter().sort().slice()`
 * through components, the whole query engine lives here as pure functions.
 *
 * MIGRATION PATH: when the backend gains `?search=&page=`, delete the body of
 * `applyReportQuery` and pass the query object to `reportApi.getAll` instead.
 * The hooks, store and components consume the same `Paginated` shape either
 * way, so nothing above this file changes.
 */

const DATE_FIELDS = new Set(['generatedAt', 'periodStart', 'periodEnd']);

/**
 * Per-report search haystack, computed once and remembered.
 *
 * A WeakMap keyed by the report object: entries disappear when the list is
 * refetched and the old objects are collected, so there is nothing to
 * invalidate. Rebuilding this per keystroke was the single most expensive
 * thing the query engine did — Unicode normalisation is not cheap, and it was
 * running once per searchable field per row per character typed.
 *
 * @type {WeakMap<object, string>}
 */
const searchIndex = new WeakMap();

const getSearchHaystack = (report) => {
  const cached = searchIndex.get(report);
  if (cached !== undefined) return cached;

  const haystack = SEARCHABLE_REPORT_FIELDS.map((field) => toSearchToken(report[field])).join(' ');
  searchIndex.set(report, haystack);
  return haystack;
};

/** One collator for the whole module — constructing one per comparison is slow. */
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** @returns {boolean} */
const matchesFilters = (report, filters) => {
  if (filters.projectId && report.projectId !== filters.projectId) return false;
  if (filters.stageId !== null && filters.stageId !== undefined && report.stageId !== filters.stageId) {
    return false;
  }
  if (filters.types?.length && !filters.types.includes(report.type)) return false;
  if (filters.formats?.length && !filters.formats.includes(report.format)) return false;
  if (
    (filters.generatedFrom || filters.generatedTo) &&
    !isWithinRange(report.generatedAt, filters.generatedFrom, filters.generatedTo)
  ) {
    return false;
  }
  return true;
};

const readSortValue = (report, field) => {
  if (DATE_FIELDS.has(field)) return toTimestamp(report[field]);
  // The Project column shows a name, so it must sort by that name — sorting by
  // the raw id would order "Retail portal" before "Core banking".
  if (field === 'projectId') return report.projectName ?? report.projectId;
  return report[field];
};

const isEmptyValue = (value) => value === null || value === undefined || value === '';

/** Compares two present values; the caller applies the sort direction. */
const compareValues = (left, right) => {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return collator.compare(String(left), String(right));
};

/**
 * @param {import('../types').Report[]} reports
 * @param {Partial<import('../types').ReportQuery>} [query]
 * @returns {import('../types').Paginated<import('../types').Report>}
 */
export const applyReportQuery = (reports, query = {}) => {
  const { filters, sort, page, pageSize } = { ...DEFAULT_REPORT_QUERY, ...query };
  const mergedFilters = { ...DEFAULT_REPORT_QUERY.filters, ...filters };

  // Normalise the needle once, not once per row.
  const needle = toSearchToken(mergedFilters.search);

  const filtered = toArray(reports).filter(
    (report) =>
      (!needle || getSearchHaystack(report).includes(needle)) &&
      matchesFilters(report, mergedFilters),
  );

  /**
   * Decorate-sort-undecorate: each sort key is read once, rather than on every
   * comparison. With the default date sort that turns O(n log n) `Date`
   * constructions into O(n).
   */
  const decorated = filtered.map((report) => {
    const value = readSortValue(report, sort.field);
    return { report, value, isEmpty: isEmptyValue(value) };
  });

  const direction = sort.direction === SORT_DIRECTION.desc ? -1 : 1;

  decorated.sort((a, b) => {
    // Empty-value bias is deliberately kept OUT of the direction multiplier: a
    // report with no period sinks to the bottom whether the column is sorted
    // ascending or descending. Multiplying it would float undated rows to the
    // top on a desc sort.
    if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
    if (a.isEmpty && b.isEmpty) return compareIds(a.report.id, b.report.id);

    const result = compareValues(a.value, b.value) * direction;
    // Ties resolve by id so the order is stable across renders and pages.
    return result === 0 ? compareIds(a.report.id, b.report.id) : result;
  });

  const total = decorated.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    items: decorated.slice(start, start + pageSize).map((entry) => entry.report),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
};

/** True when the user has narrowed the list in any way — drives the empty state. */
export const hasActiveFilters = (filters) => {
  const merged = { ...DEFAULT_REPORT_QUERY.filters, ...filters };
  return Boolean(
    merged.search ||
      merged.projectId ||
      merged.stageId !== null ||
      merged.types?.length ||
      merged.formats?.length ||
      merged.generatedFrom ||
      merged.generatedTo,
  );
};

/** Count shown on the "Filters" button badge. */
export const countActiveFilters = (filters) => {
  const merged = { ...DEFAULT_REPORT_QUERY.filters, ...filters };
  return [
    merged.projectId,
    merged.stageId !== null && merged.stageId !== undefined ? merged.stageId : null,
    merged.types?.length ? merged.types : null,
    merged.formats?.length ? merged.formats : null,
    merged.generatedFrom || merged.generatedTo ? 'period' : null,
  ].filter(Boolean).length;
};
