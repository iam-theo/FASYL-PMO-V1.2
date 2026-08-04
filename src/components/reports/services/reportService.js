import { reportApi } from '../api/reportApi';
import { CACHE_KEYS, CACHE_PREFIXES, CACHE_TTL } from '../constants/cache.constants';
import { ERROR_MESSAGES } from '../constants/messages.constants';
import { ApiError, toApiError } from '../utils/apiError';
import { indexBy, toEntityId } from '../utils/normalize';
import { requestCache } from '../utils/requestCache';
import { applyReportQuery } from '../utils/reportQuery';
import {
  toCreatePayload,
  toReport,
  toReportList,
  toUpdatePayload,
  withContext,
} from './report.mapper';
import { isProjectVisibilityScoped, projectService } from './projectService';

/**
 * Business logic for reports.
 *
 * Rules that live here rather than in a component:
 *   - raw DTOs are mapped to domain models before anything else sees them
 *   - `createdById` is stamped from the host app's auth context
 *   - a 404 on a report vs a 404 on its project mean different things to a user
 *   - list querying is delegated to the pure engine in `utils/reportQuery.js`
 *   - reads go through the cache; writes invalidate exactly what they affect
 *
 * Caching lives at this layer, not in the hooks, so that every caller benefits
 * — including a future non-React consumer — and so invalidation sits next to
 * the mutation that requires it.
 */

/** Set once by the host app so the module can stamp authorship. */
let currentUserIdProvider = null;

/** @param {() => number|null|undefined} provider */
export const configureReportsIdentity = (provider) => {
  currentUserIdProvider = provider;
};

const requireCurrentUserId = () => {
  const id = currentUserIdProvider?.();
  if (id === null || id === undefined || Number.isNaN(Number(id))) {
    throw new ApiError({
      kind: 'unauthorized',
      message: ERROR_MESSAGES.unauthorized,
    });
  }
  return Number(id);
};

/** POST/PATCH can 404 on the project or the stage, not on the report itself. */
const withReferenceErrors = (error) => {
  const apiError = toApiError(error);
  if (apiError.kind === 'not_found') {
    return new ApiError({
      kind: 'not_found',
      status: apiError.status,
      message: ERROR_MESSAGES.projectNotFound,
      fieldErrors: { projectId: ERROR_MESSAGES.projectNotFound },
      cause: apiError,
    });
  }
  return apiError;
};

export const reportService = {
  /** @returns {Promise<import('../types').Report[]>} */
  async getReports({ force = false } = {}) {
    return requestCache.read(
      CACHE_KEYS.reportsList(),
      async () => toReportList(await reportApi.getAll()),
      { ttl: CACHE_TTL.reports, force },
    );
  },

  /**
   * Reports joined with project and stage names, for the list view. One
   * projects call serves the whole page, so the table never fans out into
   * per-row lookups.
   * @returns {Promise<import('../types').ReportWithContext[]>}
   */
  async getReportsWithContext(options = {}) {
    const [reports, projects] = await Promise.all([
      this.getReports(options),
      // Names are decoration: if projects are unavailable the list still renders.
      projectService.getProjects(options).catch(() => []),
    ]);

    const projectsById = indexBy(projects, (project) => project.id);

    /*
     * When the host restricts which projects a user may see, their reports must
     * follow — otherwise a project manager reads reports for work they cannot
     * open. An empty visible set means the user may see nothing, so nothing is
     * shown. This is a presentation filter; access is enforced server-side too.
     */
    const scoped = isProjectVisibilityScoped()
      ? reports.filter((report) => projectsById.has(report.projectId))
      : reports;

    return scoped.map((report) => withContext(report, projectsById));
  },

  /** @returns {Promise<import('../types').Report>} */
  async getReportById(id, { force = false } = {}) {
    return requestCache.read(
      CACHE_KEYS.report(id),
      async () => {
        const report = toReport(await reportApi.getById(id));
        if (!report) {
          throw new ApiError({ kind: 'not_found', status: 404, message: ERROR_MESSAGES.notFound });
        }
        return report;
      },
      { ttl: CACHE_TTL.reports, force },
    );
  },

  /**
   * @param {object} formValues Already validated by `reportFormSchema`.
   * @returns {Promise<import('../types').Report>}
   */
  async createReport(formValues, options) {
    const payload = toCreatePayload(formValues, requireCurrentUserId());

    try {
      const body = await reportApi.create(payload, options);
      const created = toReport(body);

      // Every list is now out of date.
      requestCache.invalidate(CACHE_PREFIXES.reports);

      if (created) {
        requestCache.write(CACHE_KEYS.report(created.id), created, CACHE_TTL.reports);
        return created;
      }

      /*
       * The request SUCCEEDED — the report exists on the server. Only the
       * response body was not in a shape we could map. Reporting that as a
       * server error was the bug: it told the user the save had failed while
       * the record sat happily in the database.
       *
       * Return a best-effort report built from what was submitted instead. A
       * missing id means the caller cannot deep-link to it, so it falls back
       * to the list — see CreateReportPage.
       */
      if (import.meta.env?.DEV) {
        console.warn('[reports] Create succeeded but the response could not be mapped', body);
      }

      return { ...payload, id: toEntityId(body?.id), generatedAt: new Date().toISOString() };
    } catch (error) {
      throw withReferenceErrors(error);
    }
  },

  /**
   * Sends only the fields that changed. See `toUpdatePayload` for why.
   * @returns {Promise<import('../types').Report>}
   */
  async updateReport(id, formValues, original, options) {
    const payload = toUpdatePayload(formValues, original);

    // Nothing changed — skip the round trip and keep the UI honest.
    if (Object.keys(payload).length === 0) return original;

    try {
      const updated = toReport(await reportApi.update(id, payload, options));
      // Some APIs answer a PATCH with 204. Fall back to the merged local copy.
      const result = updated ?? { ...original, ...payload };

      requestCache.invalidate(CACHE_PREFIXES.reports);
      requestCache.write(CACHE_KEYS.report(id), result, CACHE_TTL.reports);
      return result;
    } catch (error) {
      throw withReferenceErrors(error);
    }
  },

  /** @returns {Promise<void>} */
  async deleteReport(id, options) {
    await reportApi.remove(id, options);
    requestCache.invalidate(CACHE_PREFIXES.reports);
  },

  /**
   * Warms the detail cache without rendering anything — see
   * `useReportPrefetch`. Failures are swallowed: a prefetch that misses just
   * means the real navigation fetches normally.
   */
  prefetchReport(id) {
    if (requestCache.peek(CACHE_KEYS.report(id)) !== undefined) return;
    this.getReportById(id).catch(() => {});
  },

  /** Call on sign-out: cached reports belong to the session that fetched them. */
  clearCache() {
    requestCache.invalidate(CACHE_PREFIXES.reports);
  },

  /**
   * Pure list querying. Exposed on the service so components ask for "the
   * current page" rather than reimplementing filter/sort logic.
   * @returns {import('../types').Paginated<import('../types').Report>}
   */
  queryReports(reports, query) {
    return applyReportQuery(reports, query);
  },
};
