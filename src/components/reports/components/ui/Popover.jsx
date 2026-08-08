import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Anchored panel used by the filter sheet and the row-action menu.
 *
 * Closes on outside pointer-down (not click — a drag that ends outside should
 * still count) and on Escape, and returns focus to the trigger so keyboard
 * users are not dropped back at the top of the page.
 *
 * On phones it renders as a bottom sheet instead: a 320px popover anchored to a
 * 36px button is unusable on a small screen.
 */
export const Popover = ({
  trigger,
  align = 'end',
  panelClassName,
  ariaLabel,
  children,
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const setOpen = (next) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    // The panel is a dialog, so focus belongs inside it once it opens —
    // otherwise a keyboard user has to tab through the whole page to reach the
    // controls they just revealed.
    const raf = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen(!isOpen),
        'aria-expanded': isOpen,
        'aria-haspopup': 'dialog',
      })}

      {isOpen && (
        <>
          {/* Scrim only exists on mobile, where the panel becomes a sheet. */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/30 sm:hidden"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label={ariaLabel}
            className={cn(
              'z-50 border border-slate-200 bg-white shadow-lg',
              'fixed inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl p-4',
              'sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 sm:max-h-none sm:rounded-xl sm:p-0',
              align === 'end' ? 'sm:right-0' : 'sm:left-0',
              panelClassName,
            )}
          >
            {children({ close: () => setOpen(false) })}
          </div>
        </>
      )}
    </div>
  );
};

Popover.propTypes = {
  /** Render prop: receives ref + aria props to spread onto the trigger. */
  trigger: PropTypes.func.isRequired,
  align: PropTypes.oneOf(['start', 'end']),
  panelClassName: PropTypes.string,
  ariaLabel: PropTypes.string,
  /** Render prop: ({ close }) => ReactNode */
  children: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  onOpenChange: PropTypes.func,
};
