/**
 * Boundary validators for INCOMING data.
 *
 * NO ZOD HERE, on purpose. These only ever answer one question — "is this row
 * usable at all?" — and running that through a schema library ties the module's
 * read path to whichever zod major the host app happens to be on. The mappers
 * already tolerate missing and misnamed fields; all these need to do is reject
 * outright garbage so one bad row cannot take down the whole table.
 *
 * They expose the same `safeParse` shape the mappers already consume, so
 * swapping zod back in later needs no change above this file.
 */

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ok = (data) => ({ success: true, data });

const fail = (message) => ({ success: false, error: { issues: [{ message }] } });

/** An id may be a number or a string, but not empty, boolean or NaN. */
const hasUsableId = (...candidates) =>
  candidates.some((value) => {
    if (value === null || value === undefined || typeof value === 'boolean') return false;
    if (typeof value === 'number') return Number.isFinite(value);
    return String(value).trim().length > 0;
  });

export const reportDtoSchema = {
  safeParse(value) {
    if (!isPlainObject(value)) return fail('Report row is not an object');
    if (!hasUsableId(value.id, value.reportId)) return fail('Report row has no usable id');
    return ok(value);
  },
};

export const projectStageDtoSchema = {
  safeParse(value) {
    if (!isPlainObject(value)) return fail('Stage row is not an object');
    if (!hasUsableId(value.id, value.stageId)) return fail('Stage row has no usable id');
    return ok(value);
  },
};

export const projectDtoSchema = {
  safeParse(value) {
    if (!isPlainObject(value)) return fail('Project row is not an object');
    if (!hasUsableId(value.projectId, value.id)) return fail('Project row has no usable id');
    return ok(value);
  },
};
