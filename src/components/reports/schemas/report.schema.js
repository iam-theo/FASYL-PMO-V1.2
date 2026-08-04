import { z } from 'zod';
import {
  REPORT_FIELD_LIMITS,
  REPORT_FORMAT,
  REPORT_FORMAT_VALUES,
  REPORT_TYPE,
  REPORT_TYPE_VALUES,
} from '../constants/report.constants';
import { isValidDate } from '../utils/date';

/**
 * Validation for the create/edit report form.
 *
 * The schema validates FORM values (everything a DOM input can hold, i.e.
 * strings), not the API payload. Converting form values → `CreateReportPayload`
 * is the mapper's job.
 *
 * ZOD 4 COMPATIBILITY: this project runs zod ^4. Three constructs from the v3
 * API are deliberately avoided because they either changed or were removed:
 *   - `z.ZodIssueCode.custom` — gone in v4; the literal `'custom'` works in both
 *   - `z.string().url()`      — deprecated in favour of `z.url()`; a `URL()`
 *                               refine works in both AND rejects "https://"
 *   - `{ errorMap: ... }`     — replaced by `error` in v4; dropped entirely
 */

const { title, description, content, fileName, fileType, fileUrl } = REPORT_FIELD_LIMITS;

/** Trims first, so "   " never passes a `min(1)` check. */
const trimmed = () => z.string().trim();

/** Optional text field: empty string is a legitimate "not provided". */
const optionalText = (max, label) =>
  trimmed()
    .max(max, `${label} cannot exceed ${max.toLocaleString()} characters`)
    .optional()
    .default('');

const datetimeLocal = (label) =>
  trimmed()
    .min(1, `${label} is required`)
    .refine(isValidDate, `Enter a valid ${label.toLowerCase()}`);

/** Version-neutral URL check. `new URL()` also rejects a bare scheme. */
const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const reportFormSchema = z
  .object({
    projectId: trimmed().min(1, 'Select the project this report covers'),

    /** '' means "whole project". Kept as a string because `<select>` values are strings. */
    stageId: trimmed().default(''),

    title: trimmed()
      .min(title.min, `Title needs at least ${title.min} characters`)
      .max(title.max, `Title cannot exceed ${title.max} characters`),

    description: optionalText(description.max, 'Description'),

    type: z.enum([...REPORT_TYPE_VALUES]),
    format: z.enum([...REPORT_FORMAT_VALUES]),

    content: optionalText(content.max, 'Content'),

    fileUrl: optionalText(fileUrl.max, 'File URL').refine(
      (value) => value === '' || isHttpUrl(value),
      'Enter a full URL, including https://',
    ),

    fileName: optionalText(fileName.max, 'File name'),
    fileType: optionalText(fileType.max, 'File type'),

    periodStart: datetimeLocal('Period start'),
    periodEnd: datetimeLocal('Period end'),
  })
  .superRefine((values, ctx) => {
    // A period that ends before it starts is the most common real mistake here,
    // so the message is attached to the field the user would go fix.
    if (isValidDate(values.periodStart) && isValidDate(values.periodEnd)) {
      if (new Date(values.periodEnd) <= new Date(values.periodStart)) {
        ctx.addIssue({
          code: 'custom',
          path: ['periodEnd'],
          message: 'The period must end after it starts',
        });
      }
    }

    // A stage report without a stage would be indistinguishable from a project
    // report once saved.
    if (values.type === REPORT_TYPE.STAGE && !values.stageId) {
      ctx.addIssue({
        code: 'custom',
        path: ['stageId'],
        message: 'Stage reports need a stage. Pick one, or switch the type to Project overview.',
      });
    }

    // A link with no name renders as an unlabelled button in the detail view.
    if (values.fileUrl && !values.fileName) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileName'],
        message: 'Name the file so people know what they are downloading',
      });
    }

    // Content or a file — a report with neither carries no information.
    if (!values.content && !values.fileUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'Add the report content, or link to a generated file',
      });
    }
  });

/** Blank form state. Exported so the form and its tests share one source. */
export const REPORT_FORM_DEFAULT_VALUES = Object.freeze({
  projectId: '',
  stageId: '',
  title: '',
  description: '',
  type: REPORT_TYPE.PROJECT,
  format: REPORT_FORMAT.PDF,
  content: '',
  fileUrl: '',
  fileName: '',
  fileType: '',
  periodStart: '',
  periodEnd: '',
});

/** Edit sends a PATCH, but the fields it does send obey the same rules. */
export const reportPatchSchema = reportFormSchema;
