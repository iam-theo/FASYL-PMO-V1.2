import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NotificationsBell from "./NotificationsBell";

function CollapseIcon({ pointsRight }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 ${pointsRight ? "" : "rotate-180"}`}
    >
      <path
        d="M3 10.5C3 6.72876 3 4.84315 4.17157 3.67157C5.34315 2.5 7.22876 2.5 11 2.5H13C16.7712 2.5 18.6569 2.5 19.8284 3.67157C21 4.84315 21 6.72876 21 10.5V13.5C21 17.2712 21 19.1569 19.8284 20.3284C18.6569 21.5 16.7712 21.5 13 21.5H11C7.22876 21.5 5.34315 21.5 4.17157 20.3284C3 19.1569 3 17.2712 3 13.5V10.5Z"
        stroke="#636363"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 2.5V21.5"
        stroke="#636363"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.5 20C4.971 16.5 7.88 15 12 15C16.12 15 19.029 16.5 20.5 20"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 12C2.5 7.52166 2.5 5.28248 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28248 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1087C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1087C2.5 18.7175 2.5 16.4783 2.5 12Z"
        stroke="#D20019"
        strokeWidth="1.5"
      />
      <path
        d="M7.03662 12.0275H14.0122M14.0122 12.0275C14.0122 12.5979 11.857 14.5148 11.857 14.5148M14.0122 12.0275C14.0122 11.4421 11.857 9.5631 11.857 9.5631M17.0366 7.99512V15.9951"
        stroke="#D20019"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The app header, shared by MainSection and the Reports shell.
 *
 * Extracted so the two cannot drift: reports previously rendered with no header
 * at all, which made switching to that tab feel like leaving the application.
 */
/** True at lg and up, where the rail sits beside the content rather than over it. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = (event) => setIsDesktop(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function TopBar({
  user,
  setIsSidebarOpen,
  isSidebarOpen = false,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  handleLogout,
}) {
  const isDesktop = useIsDesktop();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuPosition, setUserMenuPosition] = useState(null);
  const userButtonRef = useRef(null);
  const userMenuRef = useRef(null);

  /**
   * One control for the sidebar at every width. On desktop it collapses the
   * rail to icons; on mobile, where the rail is an overlay, it opens and closes
   * the drawer — which is what the hamburger used to do, so this replaces it.
   *
   * Rendered unconditionally on purpose. It used to be gated on the presence of
   * its handler, which meant forgetting to pass one made the button vanish with
   * no error to explain why.
   */
  const handleSidebarToggle = () => {
    if (!isDesktop) {
      setIsSidebarOpen?.((open) => !open);
      return;
    }
    if (onToggleSidebarCollapse) {
      onToggleSidebarCollapse();
    } else if (import.meta.env?.DEV) {
      console.warn(
        "[layout] TopBar is missing onToggleSidebarCollapse — the sidebar cannot collapse. Pass it from MainBody.",
      );
    }
  };

  const toggleLabel = !isDesktop
    ? isSidebarOpen
      ? "Close navigation"
      : "Open navigation"
    : isSidebarCollapsed
      ? "Expand sidebar"
      : "Collapse sidebar";
  const initials = (user?.fullName || "")
    .split(" ")
    .map((word) => word[0])
    .join("");

  // Close the user menu on outside click, like the notifications dropdown.
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const onPointerDown = (event) => {
      if (
        userMenuRef.current?.contains(event.target) ||
        userButtonRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsUserMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isUserMenuOpen]);

  const toggleUserMenu = () => {
    if (!isUserMenuOpen) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserMenuPosition({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setIsUserMenuOpen((current) => !current);
  };

  return (
    <header
      /* Static flex child of the content column: flex reserves its height and
         the scrolling <main> below it owns the page. No fixed positioning and
         no sidebar-offset math needed — the shell does that. */
      className="flex h-18 shrink-0 items-center justify-between gap-2 border-b border-line bg-[#FFFFFF]/95 px-4 sm:px-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={handleSidebarToggle}
          aria-label={toggleLabel}
          aria-expanded={isDesktop ? !isSidebarCollapsed : isSidebarOpen}
          title={toggleLabel}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-line-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <CollapseIcon pointsRight={isDesktop && isSidebarCollapsed} />
        </button>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <NotificationsBell />

        <div className="w-px h-6 bg-[#0000000D] hidden sm:block" />

        <button
          ref={userButtonRef}
          type="button"
          onClick={toggleUserMenu}
          aria-label="Account"
          aria-haspopup="menu"
          aria-expanded={isUserMenuOpen}
          title="Account"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#1B3C4A] cursor-pointer transition-colors hover:bg-[#16303C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3C4A]"
        >
          {initials ? (
            <span className="font-medium text-[16px]/[24px] text-[#FFFFFF]">
              {initials}
            </span>
          ) : (
            <UserIcon />
          )}
        </button>
      </div>

      {isUserMenuOpen &&
        userMenuPosition &&
        createPortal(
          <div
            ref={userMenuRef}
            role="menu"
            aria-label="Account menu"
            className="fixed z-5000 w-[min(280px,calc(100vw-16px))] flex flex-col rounded-lg border border-[#EAECF0] bg-[#FFFFFF] shadow-lg shadow-[#10182826] overflow-hidden"
            style={{ top: userMenuPosition.top, right: userMenuPosition.right }}
          >
            <div className="px-4 py-3 border-b border-[#0000000D]">
              <p className="font-semibold text-[14px]/[20px] text-[#090909] truncate">
                {user?.fullName || "User"}
              </p>
              <p className="mt-0.5 font-normal text-[13px]/[18px] text-[#636363] truncate">
                {user?.email}
              </p>
              <span className="mt-2 inline-block rounded-full bg-[#0000000D] px-2.5 py-0.5 font-medium text-[12px]/[16px] text-[#1B3C4A]">
                {user?.role}
              </span>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[#D2001914] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#D20019]"
            >
              <span className="shrink-0">
                <LogoutIcon />
              </span>
              <span className="font-medium text-[14px]/[20px] text-[#D20019]">
                Logout
              </span>
            </button>
          </div>,
          document.body,
        )}
    </header>
  );
}

export default TopBar;
