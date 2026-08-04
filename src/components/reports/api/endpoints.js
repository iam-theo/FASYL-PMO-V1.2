/**
 * Every URL the module knows about. Nothing else in the codebase builds a
 * report or project path by hand — if the API is versioned or re-mounted,
 * this file is the only edit.
 */

const encode = (value) => encodeURIComponent(String(value));

export const REPORT_ENDPOINTS = Object.freeze({
  list: () => '/reports',
  create: () => '/reports',
  detail: (id) => `/reports/${encode(id)}`,
  update: (id) => `/reports/${encode(id)}`,
  remove: (id) => `/reports/${encode(id)}`,
});

export const PROJECT_ENDPOINTS = Object.freeze({
  list: () => '/projects',
  detail: (id) => `/projects/${encode(id)}`,
});
