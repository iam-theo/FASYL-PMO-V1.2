import axios from 'axios';
import { ERROR_MESSAGES } from '../constants/messages.constants';

/**
 * @typedef {'validation'|'unauthorized'|'forbidden'|'not_found'|'conflict'|'server'|'network'|'timeout'|'canceled'|'unknown'} ApiErrorKind
 */

/**
 * The single error type the module throws. Every Axios failure is normalised
 * into one of these at the transport boundary, so nothing above `api/` ever
 * has to know what `error.response?.data?.errors` looks like.
 */
export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {ApiErrorKind} params.kind
   * @param {string} params.message   Ready to show to a user.
   * @param {number|null} [params.status]
   * @param {Record<string,string>} [params.fieldErrors]  Keyed by form field name.
   * @param {unknown} [params.cause]
   */
  constructor({ kind, message, status = null, fieldErrors = {}, cause = null }) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.cause = cause;
  }

  /** True when a retry could plausibly succeed without user action. */
  get isRetryable() {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }

  /** True when the failure belongs on the form rather than in a toast. */
  get hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0;
  }

  /** Cancellations are expected control flow, not failures to report. */
  get isCanceled() {
    return this.kind === 'canceled';
  }
}

/** @returns {value is ApiError} */
export const isApiError = (value) => value instanceof ApiError;

const KIND_BY_STATUS = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation',
};

const MESSAGE_BY_KIND = {
  validation: ERROR_MESSAGES.validation,
  unauthorized: ERROR_MESSAGES.unauthorized,
  forbidden: ERROR_MESSAGES.forbidden,
  not_found: ERROR_MESSAGES.notFound,
  conflict: ERROR_MESSAGES.conflict,
  server: ERROR_MESSAGES.server,
  network: ERROR_MESSAGES.network,
  timeout: ERROR_MESSAGES.timeout,
  canceled: 'Request cancelled.',
  unknown: ERROR_MESSAGES.unknown,
};

/** camelCase the field keys so they line up with React Hook Form names. */
const toFieldName = (key) => (key ? key.charAt(0).toLowerCase() + key.slice(1) : key);

/**
 * Flattens the validation shapes emitted by common backends:
 *   { errors: { Title: ["Title is required"] } }
 *   { errors: { title: "Title is required" } }
 * @returns {Record<string,string>}
 */
export const extractFieldErrors = (payload) => {
  const raw = payload?.errors;
  if (!raw || typeof raw !== 'object') return {};

  return Object.entries(raw).reduce((acc, [key, value]) => {
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === 'string' && message.trim()) {
      acc[toFieldName(key)] = message;
    }
    return acc;
  }, {});
};

/** Prefers a server-authored message over our generic fallback. */
const extractMessage = (payload, fallback) => {
  const candidate = payload?.message ?? payload?.detail ?? payload?.title ?? payload?.error;
  return typeof candidate === 'string' && candidate.trim() ? candidate : fallback;
};

/**
 * Normalises anything Axios (or a bug) can throw into an `ApiError`.
 * @param {unknown} error
 * @param {{ notFoundMessage?: string }} [options]
 * @returns {ApiError}
 */
export const toApiError = (error, options = {}) => {
  if (isApiError(error)) return error;

  if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
    return new ApiError({ kind: 'canceled', message: MESSAGE_BY_KIND.canceled, cause: error });
  }

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new ApiError({ kind: 'timeout', message: MESSAGE_BY_KIND.timeout, cause: error });
  }

  if (axios.isAxiosError?.(error) && !error.response) {
    return new ApiError({ kind: 'network', message: MESSAGE_BY_KIND.network, cause: error });
  }

  const status = error?.response?.status ?? null;
  if (status) {
    const kind = KIND_BY_STATUS[status] ?? (status >= 500 ? 'server' : 'unknown');
    const payload = error.response?.data;
    const fallback =
      kind === 'not_found' && options.notFoundMessage
        ? options.notFoundMessage
        : MESSAGE_BY_KIND[kind];

    return new ApiError({
      kind,
      status,
      message: extractMessage(payload, fallback),
      fieldErrors: extractFieldErrors(payload),
      cause: error,
    });
  }

  return new ApiError({
    kind: 'unknown',
    message: error?.message || MESSAGE_BY_KIND.unknown,
    cause: error,
  });
};

/** Safe message for any thrown value — use in toasts and error states. */
export const getErrorMessage = (error) =>
  isApiError(error) ? error.message : (error?.message ?? ERROR_MESSAGES.unknown);
