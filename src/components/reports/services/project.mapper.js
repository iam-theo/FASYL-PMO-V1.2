import { projectDtoSchema } from '../schemas/reportDto.schema';
import {
  pickFirst,
  toArray,
  toNullableNumber,
  toNullableString,
  toStringOr,
} from '../utils/normalize';

/**
 * Normalises the project payload.
 *
 * TWO IDs, AND ONLY ONE OF THEM IS RIGHT. The API returns both a numeric
 * primary key (`id: 18734`) and a business key (`projectId: "PROJ-925058"`).
 * Reports reference the business key, and the stages/detail endpoints are
 * addressed by it — so `projectId` wins and the numeric key is kept separately
 * as `recordId` in case anything needs it. Reading `id` first (the obvious
 * choice) breaks the report-to-project join silently: the selects still
 * populate, but nothing ever matches.
 */

/**
 * @param {unknown} dto
 * @param {string} projectId
 * @returns {import('../types').ProjectStage|null}
 */
export const toProjectStage = (dto, projectId) => {
  const id = toNullableNumber(dto?.id ?? dto?.stageId);
  if (id === null) return null;

  return {
    id,
    projectId: toStringOr(dto?.projectId, projectId),
    name: pickFirst(dto?.stageName, dto?.name, dto?.title) ?? `Stage ${id}`,
    order: toNullableNumber(
      dto?.stageOrder ?? dto?.stageIndex ?? dto?.order ?? dto?.sequence ?? dto?.orderIndex,
    ),
    startDate: toNullableString(dto?.startDate),
    endDate: toNullableString(dto?.endDate),
    /** OPEN / LOCKED / APPROVED — a locked stage still accepts a report. */
    workflowStatus: toNullableString(dto?.workflowStatus),
  };
};

/**
 * @param {unknown} dto
 * @returns {import('../types').Project|null}
 */
export const toProject = (dto) => {
  const parsed = projectDtoSchema.safeParse(dto);
  if (!parsed.success) {
    if (import.meta.env?.DEV) {
      console.warn('[reports] Dropped a malformed project row', parsed.error.issues, dto);
    }
    return null;
  }

  const raw = parsed.data;
  // Business key first — see the note above.
  const id = pickFirst(raw.projectId, raw.id);
  if (!id) return null;

  const stages = toArray(raw.stages ?? raw.projectStages)
    .map((stage) => toProjectStage(stage, id))
    .filter(Boolean)
    // Stage pickers read as a timeline, so order by sequence, then by id.
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id - b.id);

  return {
    id,
    recordId: toNullableNumber(raw.id),
    name: pickFirst(raw.projectName, raw.name, raw.title) ?? id,
    code: pickFirst(raw.code, raw.projectCode),
    status: toNullableString(raw.status),
    clientName: pickFirst(raw.clientName),
    /** Needed by the host's visibility rule — a PM sees only their own work. */
    projectManagerId: toNullableNumber(raw.projectManagerId ?? raw.projectManager?.id),
    projectManagerEmail: pickFirst(raw.projectManager?.email),
    projectManagerName: pickFirst(raw.projectManager?.fullName),
    stages,
  };
};

/** @returns {import('../types').Project[]} */
export const toProjectList = (dtos) =>
  (Array.isArray(dtos) ? dtos : [])
    .map(toProject)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
