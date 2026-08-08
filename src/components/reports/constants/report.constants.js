/**
 * Report enumerations and their presentation metadata.
 *
 * This file is the single place where a report type/format is described. Zod
 * schemas, select options and badge styling all derive from it, so adding a
 * new type is a one-line change.
 */

/** @type {Record<string, import('../types').ReportType>} */
export const REPORT_TYPE = Object.freeze({
  PROJECT: 'PROJECT',
  STAGE: 'STAGE',
  PROGRESS: 'PROGRESS',
  FINANCIAL: 'FINANCIAL',
  RISK: 'RISK',
  RESOURCE: 'RESOURCE',
  QUALITY: 'QUALITY',
  CUSTOM: 'CUSTOM',
});

/** @type {Record<string, import('../types').ReportFormat>} */
export const REPORT_FORMAT = Object.freeze({
  PDF: 'PDF',
  DOCX: 'DOCX',
  XLSX: 'XLSX',
  CSV: 'CSV',
  HTML: 'HTML',
  MARKDOWN: 'MARKDOWN',
});

export const REPORT_TYPE_VALUES = Object.freeze(Object.values(REPORT_TYPE));
export const REPORT_FORMAT_VALUES = Object.freeze(Object.values(REPORT_FORMAT));

/**
 * Human labels + Tailwind badge classes. Written from the reader's side of the
 * screen: "Financial summary", not "FINANCIAL_REPORT_TYPE".
 */
export const REPORT_TYPE_META = Object.freeze({
  [REPORT_TYPE.PROJECT]: {
    label: 'Project overview',
    description: 'Whole-project analytics across every stage',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  [REPORT_TYPE.STAGE]: {
    label: 'Stage report',
    description: 'Analytics scoped to a single project stage',
    badgeClass: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  },
  [REPORT_TYPE.PROGRESS]: {
    label: 'Progress update',
    description: 'Milestones completed and work remaining',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  [REPORT_TYPE.FINANCIAL]: {
    label: 'Financial summary',
    description: 'Budget, spend and forecast',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  [REPORT_TYPE.RISK]: {
    label: 'Risk register',
    description: 'Open risks, severity and mitigation',
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
  [REPORT_TYPE.RESOURCE]: {
    label: 'Resource allocation',
    description: 'People, utilisation and capacity',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  },
  [REPORT_TYPE.QUALITY]: {
    label: 'Quality assurance',
    description: 'Defects, reviews and acceptance criteria',
    badgeClass: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  },
  [REPORT_TYPE.CUSTOM]: {
    label: 'Custom',
    description: 'Anything that does not fit the standard set',
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  },
});

/** Badge styling used when the API returns a type we do not recognise. */
export const UNKNOWN_META = Object.freeze({
  label: 'Unspecified',
  description: '',
  badgeClass: 'bg-slate-100 text-slate-600 ring-slate-500/20',
});

export const REPORT_FORMAT_META = Object.freeze({
  [REPORT_FORMAT.PDF]: { label: 'PDF', mimeType: 'application/pdf', extension: '.pdf' },
  [REPORT_FORMAT.DOCX]: {
    label: 'Word',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
  },
  [REPORT_FORMAT.XLSX]: {
    label: 'Excel',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  [REPORT_FORMAT.CSV]: { label: 'CSV', mimeType: 'text/csv', extension: '.csv' },
  [REPORT_FORMAT.HTML]: { label: 'HTML', mimeType: 'text/html', extension: '.html' },
  [REPORT_FORMAT.MARKDOWN]: { label: 'Markdown', mimeType: 'text/markdown', extension: '.md' },
});

/** @returns {{label: string, description: string, badgeClass: string}} */
export const getReportTypeMeta = (type) => REPORT_TYPE_META[type] ?? { ...UNKNOWN_META, label: type || UNKNOWN_META.label };

/** @returns {{label: string, mimeType: string, extension: string}} */
export const getReportFormatMeta = (format) =>
  REPORT_FORMAT_META[format] ?? { label: format || '—', mimeType: '', extension: '' };

/** Select options, derived so they can never drift from the enum. */
export const REPORT_TYPE_OPTIONS = REPORT_TYPE_VALUES.map((value) => ({
  value,
  label: REPORT_TYPE_META[value].label,
  description: REPORT_TYPE_META[value].description,
}));

export const REPORT_FORMAT_OPTIONS = REPORT_FORMAT_VALUES.map((value) => ({
  value,
  label: REPORT_FORMAT_META[value].label,
}));

/** Field length limits — shared by the Zod schema and the form's counters. */
export const REPORT_FIELD_LIMITS = Object.freeze({
  title: { min: 3, max: 150 },
  description: { max: 1000 },
  content: { max: 20000 },
  fileName: { max: 255 },
  fileType: { max: 100 },
  fileUrl: { max: 2048 },
});
