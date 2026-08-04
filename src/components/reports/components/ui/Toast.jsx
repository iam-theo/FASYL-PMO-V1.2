import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { TriangleAlert, CircleCheckBig, Info, X } from 'lucide-react';
import '../../styles/reports.css';
import { TOAST_DURATION } from '../../constants/config.constants';
import { cn } from '../../utils/cn';

/**
 * Toast notifications.
 *
 * Errors use `role="alert"` (announced immediately) while successes use
 * `role="status"` (announced when the screen reader is idle) — an interrupting
 * announcement for "Report deleted" is noise, for a failure it is the point.
 * Errors also stay longer and can be dismissed but never auto-hide mid-read.
 */

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CircleCheckBig, iconClass: 'text-emerald-600', role: 'status' },
  error: { icon: TriangleAlert, iconClass: 'text-red-600', role: 'alert' },
  info: { icon: Info, iconClass: 'text-blue-600', role: 'status' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ variant = 'info', title, description = null, action = null, duration }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current, { id, variant, title, description, action }]);

      const ms = duration ?? TOAST_DURATION[variant] ?? TOAST_DURATION.info;
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ms),
      );
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      dismiss,
      toast: push,
      success: (title, options) => push({ ...options, variant: 'success', title }),
      error: (title, options) => push({ ...options, variant: 'error', title }),
      info: (title, options) => push({ ...options, variant: 'info', title }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          // sm:top-20 clears the app's fixed 4.5rem header.
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-20 sm:items-end"
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = { children: PropTypes.node };

const ToastItem = ({ toast, onDismiss }) => {
  const { icon: Icon, iconClass, role } = VARIANTS[toast.variant] ?? VARIANTS.info;

  return (
    <div
      role={role}
      className={cn(
        'reports-slide-in pointer-events-auto flex w-full max-w-sm items-start gap-3',
        'rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg',
      )}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', iconClass)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-slate-500">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
};

ToastItem.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(Object.keys(VARIANTS)),
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    action: PropTypes.shape({ label: PropTypes.string, onClick: PropTypes.func }),
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * @returns {{ toast: Function, success: Function, error: Function, info: Function, dismiss: Function }}
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>. Wrap the reports routes in it.');
  }
  return context;
};
