import PropTypes from 'prop-types';
import { ChevronDown, LoaderCircle } from 'lucide-react';
import { FormField, controlClasses } from './FormField';
import { cn } from '../../utils/cn';

/**
 * Native `<select>`, deliberately.
 *
 * A custom listbox would need to reimplement type-ahead, mobile wheel pickers
 * and screen-reader semantics that the platform already gets right. The
 * styling that matters — border, focus ring, chevron — is achievable without
 * giving that up.
 */
export const SelectField = ({
  label,
  hint,
  error,
  required,
  options,
  placeholder = 'Select an option',
  isLoading = false,
  emptyMessage = 'No options available',
  disabled = false,
  className,
  ref,
  ...rest
}) => {
  const isEmpty = !isLoading && options.length === 0;

  return (
    <FormField label={label} hint={hint} error={error} required={required} className={className}>
      {(fieldProps) => (
        <div className="relative">
          <select
            {...fieldProps}
            {...rest}
            ref={ref}
            disabled={disabled || isLoading || isEmpty}
            className={cn(controlClasses(Boolean(error)), 'appearance-none pr-9')}
          >
            <option value="">
              {isLoading ? 'Loading…' : isEmpty ? emptyMessage : placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isLoading ? (
            <LoaderCircle
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400"
            />
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
          )}
        </div>
      )}
    </FormField>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  isLoading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};
