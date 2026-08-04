import { useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Accessibility contract for every field in the module.
 *
 * The wrapper owns the id wiring so no individual field can get it wrong:
 * label→control via htmlFor/id, error and hint via aria-describedby, and
 * aria-invalid on the control itself. Children receive those ids through a
 * render prop, which keeps the wrapper agnostic about what it wraps —
 * input, textarea, select, or a composite like the date range picker.
 */
export const FormField = ({
  label,
  hint,
  error,
  required = false,
  className,
  labelSuffix = null,
  children,
}) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = cn(hint && hintId, error && errorId) || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-red-500">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {labelSuffix}
      </div>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  labelSuffix: PropTypes.node,
  /** Render prop receiving the a11y props to spread onto the control. */
  children: PropTypes.func.isRequired,
};

/** Shared control styling — one source for input, textarea and select. */
export const controlClasses = (hasError) =>
  cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
    'placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20',
  );
