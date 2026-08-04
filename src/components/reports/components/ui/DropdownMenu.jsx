import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Ellipsis } from 'lucide-react';
import { cn } from '../../utils/cn';
import { IconButton } from './Button';

/**
 * Row-action menu.
 *
 * RENDERED IN A PORTAL, ON PURPOSE. An absolutely-positioned menu inside a
 * table cell is clipped by the card's `overflow-hidden` (which draws the
 * rounded corners) and by the `overflow-x-auto` wrapper (which allows narrow
 * screens to scroll). Dropping either of those to free the menu would cost the
 * rounding or the scrolling. Portalling to `document.body` and positioning
 * `fixed` against the trigger's rect escapes both clips without changing the
 * table at all.
 *
 * The menu also flips above the trigger when the row is near the bottom of the
 * viewport — otherwise the last rows of a full page open a menu that runs off
 * the screen, which is the same bug in a different disguise.
 *
 * Implements the WAI-ARIA menu-button pattern: the trigger owns
 * `aria-haspopup="menu"`, items are `role="menuitem"`, and focus roves with the
 * arrow keys, Home/End and wraparound. Opening with ArrowUp lands on the last
 * item — the habit keyboard users bring from every native menu.
 */

// Wide enough for the longest label the menu produces
// ("Print / save as PDF") without truncating.
const MENU_WIDTH = 208;
const VIEWPORT_GUTTER = 8;
const TRIGGER_GAP = 4;
const ESTIMATED_ITEM_HEIGHT = 40;

export const DropdownMenu = ({
  items,
  label = 'Open actions menu',
  align = 'end',
  triggerIcon = Ellipsis,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const enabledIndexes = items.reduce(
    (acc, item, index) => (item.disabled ? acc : [...acc, index]),
    [],
  );

  /** Anchors the fixed menu to the trigger, flipping up when space is short. */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;

    const menuHeight =
      menuRef.current?.offsetHeight ?? items.length * ESTIMATED_ITEM_HEIGHT + VIEWPORT_GUTTER;

    const spaceBelow = window.innerHeight - trigger.bottom;
    const shouldFlip = spaceBelow < menuHeight + VIEWPORT_GUTTER && trigger.top > menuHeight;

    const rawLeft = align === 'end' ? trigger.right - MENU_WIDTH : trigger.left;
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_GUTTER;

    setPosition({
      top: shouldFlip
        ? Math.max(VIEWPORT_GUTTER, trigger.top - menuHeight - TRIGGER_GAP)
        : trigger.bottom + TRIGGER_GAP,
      left: Math.min(Math.max(VIEWPORT_GUTTER, rawLeft), Math.max(VIEWPORT_GUTTER, maxLeft)),
    });
  }, [align, items.length]);

  const close = ({ restoreFocus = true } = {}) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const open = (index = enabledIndexes[0] ?? 0) => {
    updatePosition();
    setActiveIndex(index);
    setIsOpen(true);
  };

  // Runs before paint, so the corrected position is never visible as a jump.
  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (isOpen) itemRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      if (triggerRef.current?.contains(event.target)) return;
      close({ restoreFocus: false });
    };

    // A fixed menu cannot follow a scrolling table, so close instead of drift.
    const handleScroll = () => close({ restoreFocus: false });

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const moveFocus = (direction) => {
    const position_ = enabledIndexes.indexOf(activeIndex);
    const nextPosition = (position_ + direction + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPosition]);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open(enabledIndexes[0]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      open(enabledIndexes[enabledIndexes.length - 1]);
    }
  };

  const handleMenuKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(enabledIndexes[0]);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(enabledIndexes[enabledIndexes.length - 1]);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close({ restoreFocus: false });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <IconButton
        ref={triggerRef}
        label={label}
        icon={triggerIcon}
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
      />

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={handleMenuKeyDown}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            // z-[70] sits above the app's fixed header (z-1000 is scoped to its
            // own stacking context; this is portalled to body).
            className="fixed z-[70] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            {items.map((item, index) => (
              <button
                key={item.label}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={index === activeIndex ? 0 : -1}
                disabled={item.disabled}
                onClick={() => {
                  // Close and restore focus to the trigger BEFORE running the
                  // action: if the action opens a dialog, the dialog captures
                  // the trigger as its return target rather than `body`.
                  close();
                  item.onClick();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  'focus:outline-none focus-visible:bg-slate-100',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  item.tone === 'danger'
                    ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {item.icon && <item.icon aria-hidden="true" className="size-4 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

DropdownMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.elementType,
      tone: PropTypes.oneOf(['default', 'danger']),
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  label: PropTypes.string,
  align: PropTypes.oneOf(['start', 'end']),
  triggerIcon: PropTypes.elementType,
};
