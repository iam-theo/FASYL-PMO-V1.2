import { httpClient, unwrap, unwrapCollection } from './httpClient';
import { PROJECT_ENDPOINTS } from './endpoints';

/**
 * Projects are a read-only dependency of this module: we consume them to
 * populate the project and stage selects, and never write to them.
 */
export const projectApi = {
  /** @returns {Promise<object[]>} */
  async getAll({ signal } = {}) {
    const response = await httpClient.get(PROJECT_ENDPOINTS.list(), { signal });
    return unwrapCollection(response);
  },

  /**
   * Project detail. Stages are expected to be embedded on this response —
   * see the contract note in `types/project.types.js`. If a dedicated stages
   * endpoint is added later, it goes here and `projectService` is unchanged.
   * @returns {Promise<object>}
   */
  async getById(id, { signal } = {}) {
    const response = await httpClient.get(PROJECT_ENDPOINTS.detail(id), { signal });
    return unwrap(response);
  },
};
