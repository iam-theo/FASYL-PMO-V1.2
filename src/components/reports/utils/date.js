/**
 * Date helpers. The module stores dates as ISO strings end-to-end — Date
 * objects are only created inside these functions. That keeps state
 * serialisable (URL params, Zustand persistence, optimistic cache) and avoids
 * timezone drift from repeated parse/format round-trips.
 */

/** @returns {boolean} */
export const isValidDate = (value) => {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
};

/**
 * `<input type="datetime-local">` value → ISO-8601 UTC string for the API.
 * @param {string|null|undefined} localValue e.g. "2026-08-01T09:23"
 * @returns {string|null}
 */
export const localInputToIso = (localValue) => {
  if (!localValue) return null;
  const date = new Date(localValue);
  return isValidDate(date) ? date.toISOString() : null;
};

/**
 * ISO string → `<input type="datetime-local">` value, in the user's timezone.
 * Built from local getters rather than `toISOString().slice(0,16)`, which
 * would silently shift the displayed time by the UTC offset.
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export const isoToLocalInput = (iso) => {
  if (!isValidDate(iso)) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

/** ISO string → "1 Aug 2026". Returns an em dash for missing values. */
export const formatDate = (iso, locale = undefined) => {
  if (!isValidDate(iso)) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
};

/** ISO string → "1 Aug 2026, 09:23". */
export const formatDateTime = (iso, locale = undefined) => {
  if (!isValidDate(iso)) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

/** Collapses a period into "1 Aug – 30 Sep 2026", dropping repeated units. */
export const formatDateRange = (startIso, endIso, locale = undefined) => {
  if (!isValidDate(startIso) && !isValidDate(endIso)) return '—';
  if (!isValidDate(startIso)) return `Until ${formatDate(endIso, locale)}`;
  if (!isValidDate(endIso)) return `From ${formatDate(startIso, locale)}`;

  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  const startFormat = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: sameMonth ? undefined : 'short',
    year: sameYear ? undefined : 'numeric',
  });

  return `${startFormat.format(start)} – ${formatDate(endIso, locale)}`;
};

/** "3 days ago" / "in 2 months" for the generated-at column. */
export const formatRelativeTime = (iso, locale = undefined) => {
  if (!isValidDate(iso)) return '—';

  const deltaSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(deltaSeconds) >= seconds) {
      return formatter.format(Math.round(deltaSeconds / seconds), unit);
    }
  }
  return formatter.format(Math.round(deltaSeconds), 'second');
};

/** Sortable timestamp; missing dates sink to the bottom in both directions. */
export const toTimestamp = (iso) => (isValidDate(iso) ? new Date(iso).getTime() : null);

/** Inclusive range check used by the "generated between" filter. */
export const isWithinRange = (iso, fromIso, toIso) => {
  const value = toTimestamp(iso);
  if (value === null) return false;
  const from = toTimestamp(fromIso);
  const to = toTimestamp(toIso);
  if (from !== null && value < from) return false;
  if (to !== null && value > to) return false;
  return true;
};
