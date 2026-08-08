/**
 * Project + stage domain types.
 *
 * CONTRACT GAP: the supplied API documents `GET /projects` and
 * `GET /projects/{id}` but not their response bodies, and exposes no stages
 * endpoint. `services/project.mapper.js` therefore normalises the common
 * naming variants (`name` / `projectName` / `title`, `stages` / `projectStages`)
 * and reads stages off the project detail response. If a dedicated
 * `GET /projects/{id}/stages` endpoint turns out to exist, only
 * `api/projectApi.js` changes — nothing above it moves.
 */

/**
 * @typedef {'PLANNING'|'ACTIVE'|'ON_HOLD'|'COMPLETED'|'CANCELLED'|string} ProjectStatus
 */

/**
 * @typedef {object} Project
 * @property {string} id            String id, matching `Report.projectId` (e.g. "PROJ-001").
 * @property {string} name
 * @property {string|null} code
 * @property {ProjectStatus|null} status
 * @property {ProjectStage[]} stages
 */

/**
 * @typedef {object} ProjectStage
 * @property {number} id
 * @property {string} projectId
 * @property {string} name
 * @property {number|null} order
 * @property {IsoDateString|null} startDate
 * @property {IsoDateString|null} endDate
 */

export {};
