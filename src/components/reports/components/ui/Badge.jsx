import PropTypes from 'prop-types';
import { getReportFormatMeta, getReportTypeMeta } from '../../constants/report.constants';
import { cn } from '../../utils/cn';

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
};

export const Badge = ({ tone = 'neutral', className, children, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      TONES[tone] ?? tone,
      className,
    )}
    {...rest}
  >
    {children}
  </span>
);

Badge.propTypes = {
  tone: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

/**
 * Report type badge. Unknown values coming from the API still render — with
 * the raw value and a neutral tone — rather than showing a blank cell.
 */
export const ReportTypeBadge = ({ type, className }) => {
  const meta = getReportTypeMeta(type);
  return <Badge tone={meta.badgeClass} className={className}>{meta.label}</Badge>;
};

ReportTypeBadge.propTypes = { type: PropTypes.string, className: PropTypes.string };

/** Format shown as a file-extension chip: PDF, XLSX, … */
export const FormatBadge = ({ format, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md bg-slate-900/5 px-1.5 py-0.5',
      'font-mono text-[11px] font-medium uppercase tracking-wide text-slate-600',
      className,
    )}
  >
    {getReportFormatMeta(format).label}
  </span>
);

FormatBadge.propTypes = { format: PropTypes.string, className: PropTypes.string };

const PROJECT_STATUS_TONES = {
  PLANNING: 'neutral',
  ACTIVE: 'green',
  ON_HOLD: 'amber',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

/** Generic status pill, used for project status in the filter panel. */
export const StatusBadge = ({ status, className }) => {
  if (!status) return null;
  const label = status.replace(/_/g, ' ').toLowerCase();
  return (
    <Badge tone={PROJECT_STATUS_TONES[status] ?? 'neutral'} className={cn('capitalize', className)}>
      {label}
    </Badge>
  );
};

StatusBadge.propTypes = { status: PropTypes.string, className: PropTypes.string };
