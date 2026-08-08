/**
 * Report domain types.
 *
 * `Report` is the ONLY report shape the UI is allowed to consume. Raw API
 * bodies (`ReportDto`) never leave `services/report.mapper.js`.
 */

/**
 * The API types `type` and `format` as free-form strings. We narrow them for
 * the UI (selects, badges, icons), but the mapper preserves unknown values so
 * a new server-side enum member renders as a neutral badge instead of crashing.
 *
 * @typedef {'PROJECT'|'STAGE'|'PROGRESS'|'FINANCIAL'|'RISK'|'RESOURCE'|'QUALITY'|'CUSTOM'|string} ReportType
 */

/**
 * @typedef {'PDF'|'DOCX'|'XLSX'|'CSV'|'HTML'|'MARKDOWN'|string} ReportFormat
 */

/**
 * @typedef {object} Report
 * @property {number} id
 * @property {string} projectId
 * @property {number|null} stageId
 * @property {number|null} createdById
 * @property {string} title
 * @property {string|null} description
 * @property {ReportType} type
 * @property {ReportFormat} format
 * @property {string|null} content
 * @property {string|null} fileUrl
 * @property {string|null} fileName
 * @property {string|null} fileType
 * @property {IsoDateString|null} periodStart
 * @property {IsoDateString|null} periodEnd
 * @property {IsoDateString} generatedAt
 */

/**
 * A report joined with the labels the list and detail views need. Resolved in
 * `reportService` so components never cross-reference the project store.
 *
 * @typedef {Report & { projectName: string|null, stageName: string|null }} ReportWithContext
 */

/**
 * Raw `POST /reports` body.
 *
 * @typedef {object} CreateReportPayload
 * @property {string} projectId
 * @property {number|null} stageId
 * @property {number} createdById
 * @property {string} title
 * @property {string|null} description
 * @property {ReportType} type
 * @property {ReportFormat} format
 * @property {string|null} content
 * @property {string|null} fileUrl
 * @property {string|null} fileName
 * @property {string|null} fileType
 * @property {IsoDateString|null} periodStart
 * @property {IsoDateString|null} periodEnd
 */

/**
 * `PATCH /reports/{id}` body — partial by definition, never carries createdById.
 * @typedef {Partial<Omit<CreateReportPayload, 'createdById'>>} UpdateReportPayload
 */

export {};
