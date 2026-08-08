import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_REPORT_SORT,
  PAGE_SIZE_OPTIONS,
  REPORT_SORT_FIELDS,
  SORT_DIRECTION,
} from '../constants/query.constants';
import { REPORT_FORMAT_VALUES, REPORT_TYPE_VALUES } from '../constants/report.constants';

/**
 * Filter state is mirrored in the URL so a filtered list is shareable and
 * survives a refresh. Anything can be typed into a query string, so it is
 * parsed through this schema before it reaches the query engine — an unknown
 * `?type=` value falls back to the default instead of emptying the table.
 *
 * `z.string().datetime()` is avoided (deprecated in zod 4 in favour of
 * `z.iso.datetime()`); `Date.parse` works identically here and on both majors.
 */

const csv = (allowed) =>
  z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',') : []))
    .pipe(z.array(z.enum([...allowed])).catch([]));

const isoDate = () =>
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)))
    .nullish()
    .catch(null)
    .default(null);

export const reportFiltersSchema = z.object({
  search: z.string().trim().max(200).optional().default(''),
  projectId: z.string().trim().min(1).nullish().default(null),
  stageId: z.coerce.number().int().positive().nullish().catch(null).default(null),
  types: csv(REPORT_TYPE_VALUES),
  formats: csv(REPORT_FORMAT_VALUES),
  generatedFrom: isoDate(),
  generatedTo: isoDate(),
});

export const reportSortSchema = z.object({
  field: z.enum([...Object.keys(REPORT_SORT_FIELDS)]).catch(DEFAULT_REPORT_SORT.field),
  direction: z
    .enum([SORT_DIRECTION.asc, SORT_DIRECTION.desc])
    .catch(DEFAULT_REPORT_SORT.direction),
});

export const reportQuerySchema = z.object({
  filters: reportFiltersSchema,
  sort: reportSortSchema,
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((size) => PAGE_SIZE_OPTIONS.includes(size))
    .catch(DEFAULT_PAGE_SIZE),
});
