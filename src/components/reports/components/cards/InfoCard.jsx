import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Label/value pair used across the detail page's metadata grid. Renders as a
 * definition list so the relationship between label and value survives being
 * read by a screen reader.
 */
export const InfoCard = ({ label, value, icon: Icon = null, className }) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {label}
    </dt>
    <dd className="mt-1.5 text-sm text-slate-900">{value ?? <span className="text-slate-400">—</span>}</dd>
  </div>
);

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};
