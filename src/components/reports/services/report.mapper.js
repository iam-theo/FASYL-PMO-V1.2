import { reportDtoSchema } from '../schemas/reportDto.schema';
import { REPORT_FORM_DEFAULT_VALUES } from '../schemas/report.schema';
import { isoToLocalInput, localInputToIso } from '../utils/date';
import { toEntityId, toNullableNumber, toNullableString, toStringOr } from '../utils/normalize';

/**
 * The border crossing between the wire and the UI.
 *
 * Nothing above this file sees a raw API body, and nothing below it sees a
 * form value. Three directions are supported:
 *   DTO  → Report        (reading)
 *   form → CreatePayload (writing, POST)
 *   form → UpdatePayload (writing, PATCH — diffed against the original)
 */

/**
 * Content is a `Json` column on the server, so a row can carry a free-text
 * blob or a structured object. Coerce both to a displayable string — and never
 * to the `"[object Object]"` that `String(value)` produces for objects.
 */
const toContentString = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    try {
      const text = JSON.stringify(value, null, 2);
      return text && text !== '{}' && text !== '[]' ? text : null;
    } catch {
      return null;
    }
  }
  return toNullableString(value);
};

/**
 * @param {unknown} dto
 * @returns {import('../types').Report|null} null when the row is unusable.
 */
export const toReport = (dto) => {
  const parsed = reportDtoSchema.safeParse(dto);
  if (!parsed.success) {
    // One malformed row must not take down the whole table.
    if (import.meta.env?.DEV) {
      console.warn('[reports] Dropped a malformed report row', parsed.error.issues, dto);
    }
    return null;
  }

  const raw = parsed.data;
  const id = toEntityId(raw.id ?? raw.reportId);
  if (id === null) {
    if (import.meta.env?.DEV) {
      console.warn('[reports] Report row has no usable id — dropped', dto);
    }
    return null;
  }

  return {
    id,
    projectId: toStringOr(raw.projectId),
    stageId: toNullableNumber(raw.stageId),
    createdById: toNullableNumber(raw.createdById),
    title: toStringOr(raw.title, 'Untitled report'),
    description: toNullableString(raw.description),
    type: toStringOr(raw.type),
    format: toStringOr(raw.format),
    content: toContentString(raw.content),
    fileUrl: toNullableString(raw.fileUrl),
    fileName: toNullableString(raw.fileName),
    fileType: toNullableString(raw.fileType),
    periodStart: toNullableString(raw.periodStart),
    periodEnd: toNullableString(raw.periodEnd),
    // `generatedAt` drives the default sort, so it must never be undefined.
    generatedAt: toNullableString(raw.generatedAt ?? raw.createdAt) ?? new Date().toISOString(),
  };
};

/**
 * @param {unknown[]} dtos
 * @returns {import('../types').Report[]}
 */
export const toReportList = (dtos) =>
  (Array.isArray(dtos) ? dtos : []).map(toReport).filter(Boolean);

/**
 * Report → form values. Every field becomes a string, because that is what
 * inputs hold; `null` becomes `''` so React never warns about an input
 * switching between controlled and uncontrolled.
 *
 * @param {import('../types').Report|null|undefined} report
 * @returns {typeof REPORT_FORM_DEFAULT_VALUES}
 */
export const toFormValues = (report) => {
  if (!report) return { ...REPORT_FORM_DEFAULT_VALUES };

  return {
    projectId: report.projectId ?? '',
    stageId: report.stageId === null ? '' : String(report.stageId),
    title: report.title ?? '',
    description: report.description ?? '',
    type: report.type || REPORT_FORM_DEFAULT_VALUES.type,
    format: report.format || REPORT_FORM_DEFAULT_VALUES.format,
    content: report.content ?? '',
    fileUrl: report.fileUrl ?? '',
    fileName: report.fileName ?? '',
    fileType: report.fileType ?? '',
    periodStart: isoToLocalInput(report.periodStart),
    periodEnd: isoToLocalInput(report.periodEnd),
  };
};

/**
 * Form values → `POST /reports` body.
 *
 * `createdById` is NOT a form field. It identifies the signed-in user and is
 * injected by the service from the host app's auth context — putting it on the
 * form would let a client claim authorship of someone else's report.
 *
 * @param {object} values
 * @param {number} createdById
 * @returns {import('../types').CreateReportPayload}
 */
export const toCreatePayload = (values, createdById) => ({
  projectId: values.projectId,
  stageId: toNullableNumber(values.stageId),
  createdById,
  title: values.title.trim(),
  description: toNullableString(values.description),
  type: values.type,
  format: values.format,
  content: toNullableString(values.content),
  fileUrl: toNullableString(values.fileUrl),
  fileName: toNullableString(values.fileName),
  fileType: toNullableString(values.fileType),
  periodStart: localInputToIso(values.periodStart),
  periodEnd: localInputToIso(values.periodEnd),
});

/**
 * Form values → `PATCH /reports/{id}` body, containing only what actually
 * changed. A PATCH that echoes every field back would overwrite concurrent
 * edits made by someone else in the fields this user never touched.
 *
 * @param {object} values
 * @param {import('../types').Report} original
 * @returns {import('../types').UpdateReportPayload}
 */
export const toUpdatePayload = (values, original) => {
  const next = toCreatePayload(values, original.createdById ?? 0);
  delete next.createdById;

  return Object.entries(next).reduce((patch, [key, value]) => {
    if (value !== original[key]) patch[key] = value;
    return patch;
  }, {});
};

/**
 * Joins a report with the project/stage names the list and detail views show.
 * @param {import('../types').Report} report
 * @param {Map<string, import('../types').Project>} projectsById
 * @returns {import('../types').ReportWithContext}
 */
export const withContext = (report, projectsById) => {
  const project = projectsById?.get(report.projectId) ?? null;
  const stage = project?.stages?.find((item) => item.id === report.stageId) ?? null;

  return {
    ...report,
    projectName: project?.name ?? null,
    stageName: stage?.name ?? null,
  };
};
