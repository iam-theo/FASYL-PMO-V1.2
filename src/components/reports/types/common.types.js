/**
 * Shared type definitions for the Reports module.
 *
 * These are JSDoc typedefs, not TypeScript. They are erased at build time and
 * cost nothing at runtime, but VS Code / WebStorm read them and give you
 * autocomplete, hover docs and "go to definition" on plain .js files.
 *
 * Runtime enforcement of these shapes lives in `schemas/` (Zod).
 */

/**
 * ISO-8601 date-time string.
 * @typedef {string} IsoDateString
 * @example "2026-08-01T09:23:57.021Z"
 */

/**
 * Value produced by `<input type="datetime-local">`.
 * @typedef {string} LocalDateTimeString
 * @example "2026-08-01T09:23"
 */

/**
 * @template TValue
 * @typedef {object} SelectOption
 * @property {TValue} value
 * @property {string} label
 * @property {string} [description]
 */

/**
 * Non-throwing result, used by services that must degrade instead of blow up.
 * @template TData
 * @typedef {{ ok: true, data: TData } | { ok: false, error: Error }} Result
 */

export {};
