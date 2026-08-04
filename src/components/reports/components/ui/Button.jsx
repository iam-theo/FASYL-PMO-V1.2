import PropTypes from 'prop-types';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * The module's only button. Variants encode intent, not colour — a caller asks
 * for `danger` because the action destroys something, and the palette is
 * decided here.
 */

const VARIANTS = {
  primary:
    'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-600',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-sm hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-slate-400',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600',
  link: 'bg-transparent text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 focus-visible:outline-blue-600',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

export const Button = ({
  as: Component = 'button',
  variant = 'secondary',
  size = 'md',
  type = 'button',
  isLoading = false,
  disabled = false,
  leadingIcon: LeadingIcon = null,
  trailingIcon: TrailingIcon = null,
  className,
  children,
  ref,
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <Component
      ref={ref}
      type={Component === 'button' ? type : undefined}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        LeadingIcon && <LeadingIcon aria-hidden="true" className="size-4 shrink-0" />
      )}
      {children}
      {TrailingIcon && !isLoading && (
        <TrailingIcon aria-hidden="true" className="size-4 shrink-0" />
      )}
    </Component>
  );
};

Button.propTypes = {
  as: PropTypes.elementType,
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  leadingIcon: PropTypes.elementType,
  trailingIcon: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

/** Square button for toolbars and table rows. `label` is required — an icon
 *  alone tells a screen reader nothing. */
export const IconButton = ({ label, icon: Icon, className, ...rest }) => (
  <Button size="icon" aria-label={label} title={label} className={className} {...rest}>
    <Icon aria-hidden="true" className="size-4" />
  </Button>
);

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  className: PropTypes.string,
};
