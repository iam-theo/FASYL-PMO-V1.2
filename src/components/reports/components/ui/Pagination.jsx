import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../constants/query.constants';
import { cn } from '../../utils/cn';
import { Button } from './Button';

/**
 * Page controls with a truncated page list.
 *
 * The range readout ("Showing 26–50 of 312") does more work than the buttons:
 * it tells the user where they are and how much is left, which is the question
 * people actually have when they reach the bottom of a table.
 */

/** Builds [1, '…', 4, 5, 6, '…', 20] — always ≤ 7 slots, so the row never wraps. */
const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('start-ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('end-ellipsis');
  pages.push(total);

  return pages;
};

export const Pagination = ({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange = null,
  className,
}) => {
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex items-center gap-3">
        <p aria-live="polite" className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{first.toLocaleString()}</span>–
          <span className="font-medium text-slate-700">{last.toLocaleString()}</span> of{' '}
          <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
        </p>

        {onPageSizeChange && (
          <label className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-7 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leadingIcon={ChevronLeft}
          aria-label="Previous page"
        >
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <ul className="hidden items-center gap-1 sm:flex">
          {buildPages(page, pageCount).map((entry) =>
            typeof entry === 'number' ? (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => onPageChange(entry)}
                  aria-label={`Page ${entry}`}
                  aria-current={entry === page ? 'page' : undefined}
                  className={cn(
                    'h-8 min-w-8 rounded-lg px-2 text-sm font-medium tabular-nums transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                    entry === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {entry}
                </button>
              </li>
            ) : (
              <li key={entry} aria-hidden="true" className="px-1 text-sm text-slate-400">
                …
              </li>
            ),
          )}
        </ul>

        <span className="text-sm text-slate-500 sm:hidden">
          {page} / {pageCount}
        </span>

        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          trailingIcon={ChevronRight}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
        </Button>
      </div>
    </nav>
  );
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func,
  className: PropTypes.string,
};
