import { memo } from 'react';
import PropTypes from 'prop-types';
import { useReportActions } from '../../hooks/useReportActions';
import { formatDate, formatDateRange } from '../../utils/date';
import { FormatBadge, ReportTypeBadge } from '../ui/Badge';
import { DropdownMenu } from '../ui/DropdownMenu';

/**
 * One report row.
 *
 * `memo` matters here: a table of 100 rows re-renders on every keystroke in the
 * search box otherwise. The row only depends on its own report and the stable
 * callbacks, so equality holds as long as the parent passes memoised handlers —
 * which the list page does.
 *
 * Hover and focus prefetch the report, so opening it is usually instant. Focus
 * as well as hover: keyboard users tabbing through rows get the same benefit.
 */
export const ReportTableRow = memo(({ report, onView, onEdit, onDelete, onPrefetch }) => {
  const actions = useReportActions(report, { onView, onEdit, onDelete });

  return (
    <tr
      onMouseEnter={() => onPrefetch?.(report)}
      onFocus={() => onPrefetch?.(report)}
      className="group transition-colors hover:bg-slate-50/70"
    >
      <td className="max-w-0 px-4 py-3">
        <button
          type="button"
          onClick={() => onView(report)}
          className="block max-w-full truncate rounded text-left text-sm font-medium text-slate-900 transition-colors hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {report.title}
        </button>
        {report.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{report.description}</p>
        )}
      </td>

      <td className="px-4 py-3 text-sm text-slate-600">
        <span className="block truncate">{report.projectName ?? report.projectId}</span>
        {report.stageName && (
          <span className="mt-0.5 block truncate text-xs text-slate-400">{report.stageName}</span>
        )}
      </td>

      <td className="px-4 py-3">
        <ReportTypeBadge type={report.type} />
      </td>

      <td className="px-4 py-3">
        <FormatBadge format={report.format} />
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
        {formatDateRange(report.periodStart, report.periodEnd)}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
        {formatDate(report.generatedAt)}
      </td>

      <td className="px-2 py-3 text-right">
        <DropdownMenu items={actions} label={`Actions for ${report.title}`} />
      </td>
    </tr>
  );
});

ReportTableRow.displayName = 'ReportTableRow';

ReportTableRow.propTypes = {
  report: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrefetch: PropTypes.func,
};
