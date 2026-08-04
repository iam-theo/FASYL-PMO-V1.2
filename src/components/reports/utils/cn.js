/**
 * Conditional className joiner.
 *
 * A hand-rolled `clsx` — 12 lines instead of a dependency, and the module's
 * approved package list stays short. Falsy values are dropped so callers can
 * write `cn('base', isActive && 'ring-2')`.
 *
 * @param {...(string|false|null|undefined|Record<string, boolean>)} inputs
 * @returns {string}
 */
export const cn = (...inputs) =>
  inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === 'string') return [input];
      if (Array.isArray(input)) return [cn(...input)];
      return Object.entries(input)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([className]) => className);
    })
    .filter(Boolean)
    .join(' ');
