import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import { SEARCH_DEBOUNCE_MS } from '../../constants/config.constants';
import { cn } from '../../utils/cn';

/**
 * Debounced search box.
 *
 * Keeps its own instant-feedback state so typing never feels laggy, and only
 * notifies the parent after the pause — the parent's re-filter of the whole
 * list is the expensive part. `⌘K` / `Ctrl+K` focuses it from anywhere on the
 * page, and Escape clears it.
 */
export const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search reports…',
  delay = SEARCH_DEBOUNCE_MS,
  shortcutHint = true,
  className,
  'aria-label': ariaLabel = 'Search reports',
}) => {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Re-sync when the parent resets filters from outside (e.g. "Clear filters").
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onChangeRef.current(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, delay, value]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const clear = () => {
    setDraft('');
    onChangeRef.current('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        value={draft}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && draft) {
            event.preventDefault();
            clear();
          }
        }}
        className={cn(
          'h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-16 text-sm text-slate-900 shadow-sm',
          'placeholder:text-slate-400',
          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />

      {draft ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : (
        shortcutHint && (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 sm:block"
          >
            ⌘K
          </kbd>
        )
      )}
    </div>
  );
};

SearchInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  delay: PropTypes.number,
  shortcutHint: PropTypes.bool,
  className: PropTypes.string,
  'aria-label': PropTypes.string,
};
