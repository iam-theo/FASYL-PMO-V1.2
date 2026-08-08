/**
 * Every user-facing string the module can produce, in one place.
 *
 * House style: errors state what happened and what to do next, never apologise
 * and are never vague. Actions keep the same verb from button to toast —
 * "Delete report" produces "Report deleted".
 */

export const TOAST_MESSAGES = Object.freeze({
  createSuccess: 'Report created',
  updateSuccess: 'Report updated',
  deleteSuccess: 'Report deleted',
  deleteFailed: 'The report could not be deleted. It is still in the list.',
  loadFailed: 'Reports could not be loaded.',
  copySuccess: 'Link copied',
});

export const ERROR_MESSAGES = Object.freeze({
  network: 'No response from the server. Check your connection and try again.',
  timeout: 'The request took too long. Try again.',
  unauthorized: 'Your session has expired. Sign in to continue.',
  forbidden: 'You do not have permission to do this.',
  notFound: 'That report no longer exists. It may have been deleted.',
  projectNotFound: 'That project or stage no longer exists. Pick another one.',
  validation: 'Some fields need attention before this can be saved.',
  conflict: 'This report was changed by someone else. Reload to see the latest version.',
  server: 'The server ran into a problem. Try again in a moment.',
  unknown: 'Something went wrong. Try again.',
});

export const EMPTY_STATES = Object.freeze({
  noReports: {
    title: 'No reports yet',
    body: 'Generate your first project analytics report to see it here.',
    action: 'Create report',
  },
  noResults: {
    title: 'No reports match these filters',
    body: 'Try a different search term, or clear the filters to see everything.',
    action: 'Clear filters',
  },
  noProjects: {
    title: 'No projects available',
    body: 'Reports are generated against a project, and none are available to you right now.',
    action: null,
  },
  noStages: {
    title: 'This project has no stages',
    body: 'You can still generate a project-wide report without selecting a stage.',
    action: null,
  },
});
