import PropTypes from 'prop-types';
import { FormField, controlClasses } from './FormField';
import { cn } from '../../utils/cn';

/**
 * Single-line text input. Spreads `...rest` onto the input so React Hook Form's
 * `register()` (name, onChange, onBlur, ref) drops straight in.
 */
export const TextField = ({
  label,
  hint,
  error,
  required,
  type = 'text',
  leadingIcon: LeadingIcon = null,
  className,
  inputClassName,
  ref,
  ...rest
}) => (
  <FormField label={label} hint={hint} error={error} required={required} className={className}>
    {(fieldProps) => (
      <div className="relative">
        {LeadingIcon && (
          <LeadingIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          {...fieldProps}
          {...rest}
          ref={ref}
          type={type}
          className={cn(controlClasses(Boolean(error)), LeadingIcon && 'pl-9', inputClassName)}
        />
      </div>
    )}
  </FormField>
);

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  leadingIcon: PropTypes.elementType,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

/**
 * Multi-line input with an optional live character counter. The counter turns
 * amber before the limit rather than only reporting failure after it.
 */
export const TextareaField = ({
  label,
  hint,
  error,
  required,
  rows = 4,
  maxLength,
  value,
  className,
  ref,
  ...rest
}) => {
  const used = typeof value === 'string' ? value.length : 0;
  const nearLimit = maxLength ? used > maxLength * 0.9 : false;

  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      labelSuffix={
        maxLength ? (
          <span
            aria-hidden="true"
            className={cn('text-xs tabular-nums', nearLimit ? 'text-amber-600' : 'text-slate-400')}
          >
            {used.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        ) : null
      }
    >
      {(fieldProps) => (
        <textarea
          {...fieldProps}
          {...rest}
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          value={value}
          className={cn(controlClasses(Boolean(error)), 'resize-y leading-relaxed')}
        />
      )}
    </FormField>
  );
};

TextareaField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  value: PropTypes.string,
  className: PropTypes.string,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};
