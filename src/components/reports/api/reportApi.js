import { httpClient, unwrap, unwrapCollection } from './httpClient';
import { REPORT_ENDPOINTS } from './endpoints';

/**
 * Transport only. Every function here does exactly one HTTP call, returns the
 * raw DTO and knows nothing about domain rules — mapping, validation and
 * orchestration belong to `services/`.
 *
 * Each accepts `{ signal }` so callers can abort on unmount or on a new
 * keystroke; the abort surfaces as an `ApiError` of kind `canceled`.
 */
export const reportApi = {
  /** @returns {Promise<object[]>} */
  async getAll({ signal } = {}) {
    const response = await httpClient.get(REPORT_ENDPOINTS.list(), { signal });
    return unwrapCollection(response);
  },

  /** @returns {Promise<object>} */
  async getById(id, { signal } = {}) {
    const response = await httpClient.get(REPORT_ENDPOINTS.detail(id), { signal });
    return unwrap(response);
  },

  /**
   * @param {import('../types').CreateReportPayload} payload
   * @returns {Promise<object>}
   */
  async create(payload, { signal } = {}) {
    const response = await httpClient.post(REPORT_ENDPOINTS.create(), payload, { signal });
    return unwrap(response);
  },

  /**
   * @param {number} id
   * @param {import('../types').UpdateReportPayload} payload
   * @returns {Promise<object>}
   */
  async update(id, payload, { signal } = {}) {
    const response = await httpClient.patch(REPORT_ENDPOINTS.update(id), payload, { signal });
    return unwrap(response);
  },

  /** @returns {Promise<void>} */
  async remove(id, { signal } = {}) {
    await httpClient.delete(REPORT_ENDPOINTS.remove(id), { signal });
  },
};
