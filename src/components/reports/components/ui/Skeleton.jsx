import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Loading skeletons.
 *
 * Each one mirrors the layout of the thing it replaces, so the page does not
 * jump when real data arrives. `aria-hidden` throughout — the surrounding
 * region announces "Loading reports" once, instead of a screen reader reading
 * out a dozen meaningless placeholder boxes.
 */
export const Skeleton = ({ className }) => (
  <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-slate-100', className)} />
);

Skeleton.propTypes = { className: PropTypes.string };

export const TableSkeleton = ({ rows = 6, columns = 6 }) => (
  <div role="status" aria-label="Loading reports" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
      <Skeleton className="h-3.5 w-32" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-4', columnIndex === 0 ? 'w-1/3' : 'flex-1 max-w-24')}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

TableSkeleton.propTypes = { rows: PropTypes.number, columns: PropTypes.number };

export const CardListSkeleton = ({ count = 4 }) => (
  <div role="status" aria-label="Loading reports" className="flex flex-col gap-3">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

CardListSkeleton.propTypes = { count: PropTypes.number };

export const DetailSkeleton = () => (
  <div role="status" aria-label="Loading report" className="flex flex-col gap-6">
    <div>
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="mt-3 h-4 w-1/3" />
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className={cn('h-3.5', index > 0 && 'mt-3', index === 4 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  </div>
);

export const FormSkeleton = ({ fields = 6 }) => (
  <div role="status" aria-label="Loading form" className="grid gap-5 sm:grid-cols-2">
    {Array.from({ length: fields }, (_, index) => (
      <div key={index} className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

FormSkeleton.propTypes = { fields: PropTypes.number };
