import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api";
import { subscribeRealtime } from "../../realtime";

function BellIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.52992 14.394C2.31727 15.7471 3.268 16.6862 4.43205 17.1542C8.89481 18.9486 15.1052 18.9486 19.5679 17.1542C20.732 16.6862 21.6827 15.7471 21.4701 14.394C21.3394 13.5625 20.6932 12.8701 20.2144 12.194C19.5873 11.2975 19.525 10.3197 19.5249 9.27941C19.5249 5.2591 16.1559 2 12 2C7.84413 2 4.47513 5.2591 4.47513 9.27941C4.47503 10.3197 4.41272 11.2975 3.78561 12.194C3.30684 12.8701 2.66061 13.5625 2.52992 14.394Z"
        fill="#228CEE"
        fillOpacity="0.3"
        stroke="#228CEE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21C9.79613 21.6219 10.8475 22 12 22C13.1525 22 14.2039 21.6219 15 21"
        stroke="#228CEE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const timeAgo = (value) => {
  if (!value) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * The bell in the TopBar. Polls the notifications API, shows an unread badge,
 * and renders a dropdown (via a portal so the header's scroll containers can
 * never clip it). Clicking an unread item marks it read; "Mark all as read"
 * clears the rest.
 */
function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const load = async (silent = false) => {
    try {
      // Polls are background work: skip the global loader so the bell refresh
      // never flashes the full-screen spinner while the user is idle.
      const result = await getNotifications({ skipLoader: true });
      if (result?.success) {
        setItems(result.data.notifications || []);
        setUnread(result.data.unreadCount || 0);
      }
    } catch (error) {
      // A transient failure must not drop the badge; keep the last known state.
      if (!silent) console.error("Notification refresh failed:", error);
    }
  };

  useEffect(() => {
    load();

    const unsubNotification = subscribeRealtime("notification", () => load(true));
    const unsubConnected   = subscribeRealtime("connected",    () => load(true));

    const onRefresh = () => load(true);
    window.addEventListener("notifications:refresh", onRefresh);
    return () => {
      unsubNotification();
      unsubConnected();
      window.removeEventListener("notifications:refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (
        panelRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const toggle = () => {
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
      load(true);
    }
    setOpen((current) => !current);
  };

  const handleRead = async (id) => {
    await markNotificationRead(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, readAt: item.readAt || new Date().toISOString() }
          : item,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      })),
    );
    setUnread(0);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        title="Notifications"
        className="relative w-10 h-10 flex items-center justify-center rounded-md bg-[#0000000D] cursor-pointer transition-colors hover:bg-[#00000014] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3C4A]"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-[#D20019] text-[#FFFFFF] text-[12px]/[14px] font-semibold border-2 border-[#FFFFFF]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label="Notifications"
            className="fixed z-5000 w-[min(380px,calc(100vw-16px))] max-h-[480px] flex flex-col rounded-lg border border-[#EAECF0] bg-[#FFFFFF] shadow-lg shadow-[#10182826] overflow-hidden"
            style={{ top: position.top, right: position.right }}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#0000000D]">
              <p className="font-semibold text-[14px]/[20px] text-[#090909]">
                Notifications
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleReadAll}
                  className="font-medium text-[13px]/[18px] text-[#228CEE] cursor-pointer hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center font-normal text-[14px]/[20px] text-[#636363]">
                  No notifications yet.
                </p>
              ) : (
                <ul>
                  {items.map((item) => {
                    const isUnread = !item.readAt;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => isUnread && handleRead(item.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[#00000008] ${
                            isUnread ? "bg-[#228CEE0D]" : ""
                          }`}
                        >
                          <span
                            className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${
                              isUnread ? "bg-[#228CEE]" : "bg-[#00000026]"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium text-[14px]/[20px] text-[#090909]">
                              {item.title}
                            </span>
                            {item.message && (
                              <span className="block mt-0.5 font-normal text-[13px]/[18px] text-[#636363]">
                                {item.message}
                              </span>
                            )}
                            <span className="block mt-1 font-normal text-[12px]/[16px] text-[#98A2B3]">
                              {timeAgo(item.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default NotificationsBell;
