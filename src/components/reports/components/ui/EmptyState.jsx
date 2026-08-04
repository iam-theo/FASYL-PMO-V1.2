import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

/**
 * An empty screen is an invitation to act, so this always offers the next step
 * when there is one — "Create report" on a first-run list, "Clear filters" when
 * the user has filtered everything away.
 */
export const EmptyState = ({
  icon: Icon = FileText,
  title,
  description = null,
  action = null,
  secondaryAction = null,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center',
      className,
    )}
  >
    <div className="flex size-11 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-100">
      <Icon aria-hidden="true" className="size-5 text-slate-400" />
    </div>

    <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}

    {(action || secondaryAction) && (
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {action && (
          <Button variant="primary" leadingIcon={action.icon} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    )}
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  className: PropTypes.string,
};
