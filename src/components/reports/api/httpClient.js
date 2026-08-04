import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config.constants';
import { toApiError } from '../utils/apiError';

/**
 * The module's single Axios instance.
 *
 * It is deliberately NOT the host app's client: a feature module that brings
 * its own transport can be mounted without the host having to expose its
 * internals. The host wires in auth through `configureReportsApi()`, which is
 * the one seam between the two.
 */

/** @type {{ getAuthToken: (() => string|null|undefined)|null, onUnauthorized: (() => void)|null }} */
const runtimeConfig = {
  getAuthToken: null,
  onUnauthorized: null,
};

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/**
 * Called once by the host PMO app during bootstrap.
 *
 * @param {object} options
 * @param {string} [options.baseUrl]
 * @param {number} [options.timeoutMs]
 * @param {() => string|null|undefined} [options.getAuthToken] Read from the host's auth store.
 * @param {() => void} [options.onUnauthorized] Host's sign-out handler, fired on 401.
 */
export const configureReportsApi = ({ baseUrl, timeoutMs, getAuthToken, onUnauthorized } = {}) => {
  if (baseUrl) httpClient.defaults.baseURL = baseUrl;
  if (timeoutMs) httpClient.defaults.timeout = timeoutMs;
  if (getAuthToken) runtimeConfig.getAuthToken = getAuthToken;
  if (onUnauthorized) runtimeConfig.onUnauthorized = onUnauthorized;
};

httpClient.interceptors.request.use((config) => {
  const token = runtimeConfig.getAuthToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    if (apiError.kind === 'unauthorized') {
      runtimeConfig.onUnauthorized?.();
    }
    // Reject with the normalised error so no caller ever touches an AxiosError.
    return Promise.reject(apiError);
  },
);

/**
 * Unwraps `{ success, message, data: … }` envelopes while passing bare
 * resources through. The PMO API uses the envelope on every endpoint.
 *
 * Also digs one level further for `{ data: { report: {…} } }` and `{ message,
 * report: {…} }` — the extra nesting used to make a successful write look like
 * an unparseable response.
 */
const RESOURCE_KEYS = ['report', 'project', 'item', 'result', 'record'];

export const unwrap = (response) => {
  let body = response?.data;

  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    body = body.data;
  }

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const nestedKey = RESOURCE_KEYS.find(
      (key) => body[key] && typeof body[key] === 'object' && !Array.isArray(body[key]),
    );
    // A bare resource can carry object-valued keys of its own (a report embeds
    // its project and stage), so only unwrap when the write-envelope markers
    // are present — `{ message, report }` — or when the key is all there is.
    if (nestedKey) {
      const isEnvelope = 'message' in body || 'success' in body;
      if (isEnvelope || Object.keys(body).length === 1) return body[nestedKey];
    }
  }

  return body;
};

/** Same idea for collections, tolerating `{ items }` / `{ results }` wrappers. */
export const unwrapCollection = (response) => {
  const body = unwrap(response);
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};
