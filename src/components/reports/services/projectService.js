import { projectApi } from '../api/projectApi';
import { CACHE_KEYS, CACHE_PREFIXES, CACHE_TTL } from '../constants/cache.constants';
import { toArray } from '../utils/normalize';
import { requestCache } from '../utils/requestCache';
import { toProject, toProjectList } from './project.mapper';

/**
 * Projects are read-only here. The service exists so the report form can ask
 * "what stages does this project have?" without knowing whether that answer
 * comes from an embedded array, a second request, or the cache.
 *
 * Projects are cached longer than reports (see `CACHE_TTL`): a PMO adds a
 * project a week, but generates reports daily.
 */
/**
 * Host-supplied visibility rule.
 *
 * WHO MAY SEE WHICH PROJECT IS THE HOST'S POLICY, NOT THE MODULE'S. The PMO app
 * already decides this for its own project list (head of ops sees everything, a
 * project manager sees what they are assigned). Re-deriving that here would put
 * the same rule in two places, free to drift. The host passes it in instead.
 *
 * NOTE: this is a presentation filter, not a security boundary. The API still
 * returns every project it is asked for. Enforce access server-side too.
 *
 * @type {((projects: import('../types').Project[]) => import('../types').Project[])|null}
 */
let projectVisibilityFilter = null;

/** Wired by `configureReports({ filterProjects })`. */
export const configureProjectVisibility = (filter) => {
  projectVisibilityFilter = typeof filter === 'function' ? filter : null;
};

/** True when the host has narrowed visibility — reports are scoped to match. */
export const isProjectVisibilityScoped = () => projectVisibilityFilter !== null;

export const projectService = {
  /** @returns {Promise<import('../types').Project[]>} */
  async getProjects({ force = false } = {}) {
    return requestCache.read(
      CACHE_KEYS.projectsList(),
      async () => {
        const projects = toProjectList(await projectApi.getAll());
        if (!projectVisibilityFilter) return projects;

        const visible = projectVisibilityFilter(projects);
        return Array.isArray(visible) ? visible : projects;
      },
      { ttl: CACHE_TTL.projects, force },
    );
  },

  /** @returns {Promise<import('../types').Project|null>} */
  async getProjectById(projectId, { force = false } = {}) {
    if (!projectId) return null;

    return requestCache.read(
      CACHE_KEYS.project(projectId),
      async () => toProject(await projectApi.getById(projectId)),
      { ttl: CACHE_TTL.projects, force },
    );
  },

  /**
   * Stages for one project.
   *
   * The list endpoint embeds stages, so it is tried first — that is almost
   * always a cache hit and costs no request. The detail endpoint is only used
   * if the listed project carries no stages, which keeps this working against
   * a backend that trims the list payload.
   *
   * @returns {Promise<import('../types').ProjectStage[]>}
   */
  async getProjectStages(projectId, options) {
    if (!projectId) return [];

    const projects = await this.getProjects(options).catch(() => []);
    const listed = projects.find((project) => project.id === projectId);
    if (listed?.stages?.length) return listed.stages;

    const project = await this.getProjectById(projectId, options);
    return toArray(project?.stages);
  },

  /** Call after a project changes elsewhere in the PMO app. */
  invalidateProject(projectId) {
    requestCache.invalidate(projectId ? CACHE_KEYS.project(projectId) : CACHE_PREFIXES.projects);
  },
};
