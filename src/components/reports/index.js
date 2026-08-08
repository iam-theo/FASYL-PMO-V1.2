/**
 * Public surface of the Reports module.
 *
 * The host PMO app imports from here and nowhere else. Everything not
 * re-exported below is an internal detail and free to change.
 *
 * Bootstrap in the host app:
 *
 *   import { configureReports } from '@/modules/reports';
 *
 *   configureReports({
 *     baseUrl: import.meta.env.VITE_API_BASE_URL,
 *     getAuthToken: () => useAuthStore.getState().accessToken,
 *     getCurrentUserId: () => useAuthStore.getState().user?.id,
 *     onUnauthorized: () => useAuthStore.getState().signOut(),
 *   });
 */
import { configureReportsApi } from './api/httpClient';
import { configureReportsIdentity } from './services/reportService';
import { configureProjectVisibility } from './services/projectService';
import { requestCache } from './utils/requestCache';

/**
 * One call to wire the module into the host app's transport and auth.
 *
 * @param {object} options
 * @param {string} [options.baseUrl]
 * @param {number} [options.timeoutMs]
 * @param {() => string|null|undefined} [options.getAuthToken]
 * @param {() => number|null|undefined} [options.getCurrentUserId]
 * @param {() => void} [options.onUnauthorized]
 * @param {(projects: object[]) => object[]} [options.filterProjects]
 *        Narrows which projects — and therefore which reports — are visible.
 *        Presentation only; enforce the same rule server-side.
 */
export const configureReports = ({ getCurrentUserId, filterProjects, ...transport } = {}) => {
  configureReportsApi(transport);
  if (getCurrentUserId) configureReportsIdentity(getCurrentUserId);
  configureProjectVisibility(filterProjects);
};

/**
 * Drops every cached report and project.
 *
 * Call this on sign-out. Cached data belongs to the session that fetched it,
 * and the next user to sign in on the same browser must not see it.
 */
export const resetReportsCache = () => requestCache.clear();

export * from './components';
export * from './hooks';
export { ReportsRoutes } from './routes';

// Pages are deliberately NOT re-exported: they are reached through
// `ReportsRoutes`, and putting them in this barrel would pull every page into
// the host's main chunk and undo the code splitting in `routes.jsx`.
// Import them directly if you need to compose one yourself:
//   import { ReportsListPage } from '@/modules/reports/pages';
export * from './constants';
export * from './services';
export * from './schemas';
export * from './utils';

