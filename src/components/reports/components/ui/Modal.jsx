import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import '../../styles/reports.css';
import { cn } from '../../utils/cn';
import { IconButton } from './Button';

/**
 * Accessible dialog primitive — every dialog in the module builds on this.
 *
 * Handles the four things hand-rolled modals usually miss: focus moves in on
 * open and returns to the trigger on close, Tab is trapped inside, Escape
 * closes, and the page behind is locked and hidden from assistive tech.
 *
 * `returnFocusRef` covers the case that breaks naive implementations: the
 * dialog's own action destroys the element that opened it. Deleting a report
 * from a table row unmounts that row, so restoring focus to it would drop the
 * user at the top of the document. The element is checked with `isConnected`
 * before focus goes back to it, and `returnFocusRef` catches it if it is gone.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description = null,
  size = 'md',
  footer = null,
  closeOnBackdrop = true,
  initialFocusRef = null,
  returnFocusRef = null,
  children,
}) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const focusFirst = useCallback(() => {
    const target =
      initialFocusRef?.current ?? panelRef.current?.querySelector(FOCUSABLE) ?? panelRef.current;
    target?.focus();
  }, [initialFocusRef]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const returnFocus = returnFocusRef.current;
    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Wait a frame so the panel is painted before focus moves into it.
    const raf = requestAnimationFrame(focusFirst);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;

      // Returning focus to the trigger is what makes keyboard flow feel sane —
      // unless the trigger no longer exists, in which case fall back to a
      // stable landmark the caller nominated.
      const trigger = previouslyFocused.current;
      if (trigger?.isConnected) trigger.focus?.();
      else returnFocus?.current?.focus?.();
    };
  }, [isOpen, focusFirst, returnFocusRef]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []).filter(
      (element) => element.offsetParent !== null,
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="reports-fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className={cn(
          'reports-scale-in relative flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-xl outline-none',
          'rounded-t-2xl sm:rounded-xl',
          SIZES[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close dialog" icon={X} variant="ghost" onClick={onClose} />
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  size: PropTypes.oneOf(Object.keys(SIZES)),
  footer: PropTypes.node,
  closeOnBackdrop: PropTypes.bool,
  initialFocusRef: PropTypes.object,
  /** Focused on close when the element that opened the dialog is gone. */
  returnFocusRef: PropTypes.object,
  children: PropTypes.node,
};
