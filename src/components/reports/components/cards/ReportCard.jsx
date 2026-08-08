import { memo } from 'react';
import PropTypes from 'prop-types';
import { CalendarRange, FolderOpen } from 'lucide-react';
import { useReportActions } from '../../hooks/useReportActions';
import { formatDateRange, formatRelativeTime } from '../../utils/date';
import { FormatBadge, ReportTypeBadge } from '../ui/Badge';
import { DropdownMenu } from '../ui/DropdownMenu';

/**
 * Card presentation of a report — the mobile counterpart of a table row, and
 * reusable anywhere a report needs to appear outside the list (a project
 * dashboard, a "recent reports" panel).
 */
export const ReportCard = memo(({ report, onView, onEdit, onDelete, onPrefetch }) => {
  const actions = useReportActions(report, { onView, onEdit, onDelete });

  return (
    <article
      onMouseEnter={() => onPrefetch?.(report)}
      onFocus={() => onPrefetch?.(report)}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onView(report)}
          className="min-w-0 flex-1 rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <h3 className="truncate text-sm font-semibold text-slate-900">{report.title}</h3>
          {report.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{report.description}</p>
          )}
        </button>

        <DropdownMenu items={actions} label={`Actions for ${report.title}`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ReportTypeBadge type={report.type} />
        <FormatBadge format={report.format} />
      </div>

      <dl className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <FolderOpen aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
          <dt className="sr-only">Project</dt>
          <dd className="truncate">
            {report.projectName ?? report.projectId}
            {report.stageName && <span className="text-slate-400"> · {report.stageName}</span>}
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarRange aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
          <dt className="sr-only">Period</dt>
          <dd>{formatDateRange(report.periodStart, report.periodEnd)}</dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-slate-400">
        Generated <time dateTime={report.generatedAt}>{formatRelativeTime(report.generatedAt)}</time>
      </p>
    </article>
  );
});

ReportCard.displayName = 'ReportCard';

ReportCard.propTypes = {
  report: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func,
};
