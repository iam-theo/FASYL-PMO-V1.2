import PropTypes from 'prop-types';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { SORT_DIRECTION } from '../../constants/query.constants';
import { cn } from '../../utils/cn';

/**
 * Sortable `<th>`.
 *
 * `aria-sort` on the cell is what tells a screen reader the table is ordered
 * and by which column — the arrow icon alone conveys nothing. The icon is a
 * neutral up/down chevron until the column is active, so every sortable column
 * advertises itself without implying a current state.
 */
export const SortableColumnHeader = ({ field, label, sort, onSortChange, align = 'left', className }) => {
  const isActive = sort.field === field;
  const isAscending = isActive && sort.direction === SORT_DIRECTION.asc;

  const Icon = !isActive ? ChevronsUpDown : isAscending ? ArrowUp : ArrowDown;

  const handleClick = () => {
    onSortChange({
      field,
      // Re-clicking the active column flips it; a new column starts ascending.
      direction: isActive && isAscending ? SORT_DIRECTION.desc : SORT_DIRECTION.asc,
    });
  };

  return (
    <th
      scope="col"
      aria-sort={isActive ? (isAscending ? 'ascending' : 'descending') : 'none'}
      className={cn('px-4 py-2.5 text-left font-medium', className)}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group inline-flex items-center gap-1.5 rounded text-xs uppercase tracking-wide transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
          align === 'right' && 'flex-row-reverse',
          isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
        )}
      >
        {label}
        <Icon
          aria-hidden="true"
          className={cn(
            'size-3.5 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60',
          )}
        />
      </button>
    </th>
  );
};

SortableColumnHeader.propTypes = {
  field: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sort: PropTypes.shape({
    field: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
  onSortChange: PropTypes.func.isRequired,
  align: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
};
