import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_REPORT_QUERY,
  DEFAULT_REPORT_SORT,
} from '../constants/query.constants';
import { QUERY_PARAM_KEYS } from '../constants/routes.constants';
import { reportFiltersSchema, reportSortSchema } from '../schemas/reportFilters.schema';

/**
 * List state (filters, sort, page) lives in the URL.
 *
 * WHY NOT A STORE: this state is derived from and owned by the address bar. A
 * filtered list is then shareable, survives a refresh, and works with the back
 * button for free. Mirroring it into Zustand as well would create two sources
 * of truth that have to be kept in sync — the classic way this breaks is the
 * back button changing the URL while the store keeps rendering the old page.
 *
 * Anything can be typed into a query string, so every value is parsed through
 * the Zod schemas, which `.catch()` back to defaults instead of throwing.
 */

const readList = (params, key) => {
  const value = params.get(key);
  return value ?? undefined;
};

export const useReportQueryState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => {
    const filters = reportFiltersSchema.safeParse({
      search: searchParams.get(QUERY_PARAM_KEYS.search) ?? '',
      projectId: searchParams.get(QUERY_PARAM_KEYS.projectId),
      stageId: searchParams.get(QUERY_PARAM_KEYS.stageId),
      types: readList(searchParams, QUERY_PARAM_KEYS.types),
      formats: readList(searchParams, QUERY_PARAM_KEYS.formats),
      generatedFrom: searchParams.get(QUERY_PARAM_KEYS.generatedFrom),
      generatedTo: searchParams.get(QUERY_PARAM_KEYS.generatedTo),
    });

    const sort = reportSortSchema.safeParse({
      field: searchParams.get(QUERY_PARAM_KEYS.sortField) ?? DEFAULT_REPORT_SORT.field,
      direction: searchParams.get(QUERY_PARAM_KEYS.sortDirection) ?? DEFAULT_REPORT_SORT.direction,
    });

    const page = Number(searchParams.get(QUERY_PARAM_KEYS.page)) || 1;
    const pageSize = Number(searchParams.get(QUERY_PARAM_KEYS.pageSize)) || DEFAULT_PAGE_SIZE;

    return {
      filters: filters.success ? filters.data : DEFAULT_REPORT_QUERY.filters,
      sort: sort.success ? sort.data : DEFAULT_REPORT_SORT,
      page: Math.max(1, page),
      pageSize,
    };
  }, [searchParams]);

  /**
   * Writes only what differs from the defaults, so an unfiltered list has a
   * clean `/reports` URL rather than a trail of empty parameters.
   */
  const write = useCallback(
    (next) => {
      const params = new URLSearchParams();
      const { filters, sort, page, pageSize } = next;

      if (filters.search) params.set(QUERY_PARAM_KEYS.search, filters.search);
      if (filters.projectId) params.set(QUERY_PARAM_KEYS.projectId, filters.projectId);
      if (filters.stageId) params.set(QUERY_PARAM_KEYS.stageId, String(filters.stageId));
      if (filters.types?.length) params.set(QUERY_PARAM_KEYS.types, filters.types.join(','));
      if (filters.formats?.length) params.set(QUERY_PARAM_KEYS.formats, filters.formats.join(','));
      if (filters.generatedFrom) params.set(QUERY_PARAM_KEYS.generatedFrom, filters.generatedFrom);
      if (filters.generatedTo) params.set(QUERY_PARAM_KEYS.generatedTo, filters.generatedTo);

      if (sort.field !== DEFAULT_REPORT_SORT.field) params.set(QUERY_PARAM_KEYS.sortField, sort.field);
      if (sort.direction !== DEFAULT_REPORT_SORT.direction) {
        params.set(QUERY_PARAM_KEYS.sortDirection, sort.direction);
      }

      if (page > 1) params.set(QUERY_PARAM_KEYS.page, String(page));
      if (pageSize !== DEFAULT_PAGE_SIZE) params.set(QUERY_PARAM_KEYS.pageSize, String(pageSize));

      // `replace` keeps typing in the search box out of the history stack —
      // otherwise Back walks the user through every keystroke.
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (filters) => write({ ...query, filters, page: 1 }),
    [query, write],
  );

  const setSort = useCallback((sort) => write({ ...query, sort }), [query, write]);

  const setPage = useCallback((page) => write({ ...query, page }), [query, write]);

  const setPageSize = useCallback(
    (pageSize) => write({ ...query, pageSize, page: 1 }),
    [query, write],
  );

  const resetFilters = useCallback(
    () => write({ ...query, filters: DEFAULT_REPORT_QUERY.filters, page: 1 }),
    [query, write],
  );

  return { query, setFilters, setSort, setPage, setPageSize, resetFilters };
};
