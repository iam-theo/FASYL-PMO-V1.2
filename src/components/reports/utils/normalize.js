/**
 * Small coercion helpers used by the DTO mappers. Every one of them answers
 * the same question: "the server sent me something — what is the safest value
 * the UI can render?"
 */

/** Trimmed string, or null. Empty strings become null so the API stays clean. */
export const toNullableString = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

/** Required string with a fallback — never returns null. */
export const toStringOr = (value, fallback = '') => toNullableString(value) ?? fallback;

/** Numeric id, or null. Rejects NaN, empty strings and booleans. */
export const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Entity id, kept in whatever form the backend uses.
 *
 * Numeric ids become numbers so they sort and compare naturally; anything else
 * non-empty (uuid, cuid, "PROJ-001") is kept as a trimmed string. Forcing
 * `Number()` here was silently discarding whole records — a report with a uuid
 * id parsed to NaN, the mapper returned null, and a successful POST surfaced
 * as a server error.
 */
export const toEntityId = (value) => {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const text = String(value).trim();
  if (!text) return null;
  return /^-?\d+$/.test(text) ? Number(text) : text;
};

/** Comparator for ids that may be numbers or strings. Stable either way. */
export const compareIds = (left, right) => {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true });
};

/** Always an array — protects `.map()` calls from a null collection. */
export const toArray = (value) => (Array.isArray(value) ? value : []);

/** First defined, non-empty value from a list of candidate DTO keys. */
export const pickFirst = (...values) => {
  for (const value of values) {
    const normalized = toNullableString(value);
    if (normalized !== null) return normalized;
  }
  return null;
};

/** Case- and accent-insensitive haystack for the search box. */
export const toSearchToken = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Groups a list into a Map keyed by the accessor's return value. */
export const indexBy = (items, getKey) =>
  toArray(items).reduce((map, item) => {
    map.set(getKey(item), item);
    return map;
  }, new Map());
