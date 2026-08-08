import PropTypes from 'prop-types';
import { RefreshCw, ServerCrash, WifiOff } from 'lucide-react';
import { getErrorMessage, isApiError } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { Button } from './Button';

/**
 * Failure state for a page or a panel.
 *
 * Reads the normalised `ApiError` to decide what to say and whether retrying
 * is even worth offering — a 403 gets no retry button, because pressing it
 * would just fail again.
 *
 * When retry is not offered, `action` must be: a dead end with no way forward
 * is the one thing an error state must never be. The 404 case is exactly this —
 * "that report is gone" is useless without "back to reports".
 */
export const ErrorState = ({ error, onRetry = null, action = null, title = null, className }) => {
  const kind = isApiError(error) ? error.kind : 'unknown';
  const canRetry = Boolean(onRetry) && (!isApiError(error) || error.isRetryable);
  const Icon = kind === 'network' || kind === 'timeout' ? WifiOff : ServerCrash;

  const headings = {
    network: 'No connection',
    timeout: 'The request timed out',
    forbidden: 'You cannot view this',
    not_found: 'Not found',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/40 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-white ring-1 ring-inset ring-red-100">
        <Icon aria-hidden="true" className="size-5 text-red-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {title ?? headings[kind] ?? 'Something went wrong'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-600">{getErrorMessage(error)}</p>

      {(canRetry || action) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {canRetry && (
            <Button variant="secondary" leadingIcon={RefreshCw} onClick={onRetry}>
              Try again
            </Button>
          )}
          {action && (
            <Button
              variant={canRetry ? 'ghost' : 'secondary'}
              leadingIcon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

ErrorState.propTypes = {
  error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.object]),
  onRetry: PropTypes.func,
  /** A way forward when retrying cannot help. Required in practice for 404s. */
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }),
  title: PropTypes.string,
  className: PropTypes.string,
};

/** Inline variant for a failed panel inside an otherwise working page. */
export const InlineError = ({ error, onRetry = null, className }) => (
  <div
    role="alert"
    className={cn(
      'flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5',
      className,
    )}
  >
    <p className="text-sm text-red-800">{getErrorMessage(error)}</p>
    {onRetry && (
      <Button variant="ghost" size="sm" onClick={onRetry} className="text-red-700 hover:bg-red-100">
        Retry
      </Button>
    )}
  </div>
);

InlineError.propTypes = {
  error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.object]),
  onRetry: PropTypes.func,
  className: PropTypes.string,
};
