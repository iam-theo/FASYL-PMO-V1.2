import { useEffect, useState } from "react";
import { api } from "../../api";
import { useNotification } from "../NotificationContext";

const MODULES = [
  "Auth",
  "Projects",
  "Workflow",
  "Tasks",
  "Reports",
  "Reminders",
  "Notifications",
];

const moduleChipStyles = {
  Auth: "bg-[#EEF4FF] text-[#3538CD]",
  Projects: "bg-[#EFF8FF] text-[#175CD3]",
  Workflow: "bg-[#FFF6ED] text-[#C4320A]",
  Tasks: "bg-[#F0FDF4] text-[#15803D]",
  Reports: "bg-[#FFFAEB] text-[#B54708]",
  Reminders: "bg-[#FDF2FA] text-[#C11574]",
  Notifications: "bg-[#F2F4F7] text-[#475467]",
};

function formatTime(iso) {
  try {
    const date = new Date(iso);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function parseDetails(details) {
  try {
    const parsed = JSON.parse(details);
    return parsed?.summary || "";
  } catch {
    return details || "";
  }
}

function actorLabel(user) {
  if (!user) return "System / Unknown";
  return user.fullName || user.email || "Unknown";
}

function ModuleBadge({ module }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium whitespace-nowrap ${
        moduleChipStyles[module] || moduleChipStyles.Notifications
      }`}
    >
      {module}
    </span>
  );
}

function AuditRows({ logs }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-line-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 8v4l2.5 2.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
              stroke="#5B6470"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-[15px]/[22px] font-semibold text-ink">
            No activity yet
          </h3>
          <p className="mt-1 text-[13px]/[20px] text-ink-soft">
            Actions taken on the portal will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full min-w-[680px] text-left">
        <thead className="bg-line-soft/60">
          <tr>
            <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
              Time
            </th>
            <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
              Who
            </th>
            <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
              Module
            </th>
            <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
              What was done
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {logs.map((log) => (
            <tr key={log.id} className="transition-colors hover:bg-line-soft/40">
              <td
                className="px-5 py-4 text-[13px]/[20px] whitespace-nowrap text-ink-soft"
                title={new Date(log.createdAt).toLocaleString()}
              >
                {formatTime(log.createdAt)}
              </td>
              <td className="px-5 py-4">
                <p className="max-w-[180px] truncate text-[13px]/[20px] font-medium text-ink">
                  {actorLabel(log.user)}
                </p>
                {log.user?.email && (
                  <p className="max-w-[180px] truncate text-[12px]/[18px] text-ink-muted">
                    {log.user.email}
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                <ModuleBadge module={log.module} />
              </td>
              <td className="px-5 py-4">
                <p className="text-[13px]/[20px] font-medium text-ink">
                  {log.action}
                </p>
                {parseDetails(log.details) && (
                  <p className="max-w-[300px] truncate text-[12px]/[18px] text-ink-muted">
                    {parseDetails(log.details)}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [module, setModule] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { showNotification } = useNotification();

  const pageSize = showAll ? 25 : 10;

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/audit", {
          params: { page, pageSize, module: module || undefined, search: search || undefined },
          skipLoader: true,
        });
        if (ignore) return;
        setLogs(data.data.logs);
        setTotal(data.data.total);
      } catch (err) {
        console.error(err);
        if (!ignore) {
          showNotification({
            type: "error",
            title: "Failed to load activity log",
            message: err.response?.data?.error || "Something went wrong",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [page, module, search, pageSize, showNotification]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const panel = (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px]/[22px] font-semibold text-ink">
            Recent Activity
          </h3>
          <p className="text-[13px]/[20px] text-ink-soft">
            Every action taken on the portal, with who did it and when
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px]/[20px] font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft cursor-pointer"
        >
          View All ({total})
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="px-6 py-12 text-center text-[13px]/[20px] text-ink-soft">
          Loading activity…
        </div>
      ) : (
        <AuditRows logs={logs} />
      )}
    </div>
  );

  return (
    <>
      {panel}

      {showAll && (
        <div
          className="fixed inset-0 z-2000 bg-[#00000080] flex items-center justify-center p-4"
          onClick={() => setShowAll(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden rounded-xl bg-[#F7F7F7]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
              <div>
                <h3 className="text-[16px]/[24px] font-semibold text-ink">
                  Activity Log
                </h3>
                <p className="text-[13px]/[20px] text-ink-soft">
                  {total} recorded action{total === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-line-soft cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-line bg-surface px-5 py-3 sm:flex-row sm:items-center">
              <select
                value={module}
                onChange={(e) => {
                  setModule(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px]/[20px] text-[#090909] outline-none cursor-pointer"
              >
                <option value="">All modules</option>
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search action, actor or email…"
                className="h-9 min-w-0 flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 text-[13px]/[20px] text-[#090909] outline-none"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-surface">
              {loading ? (
                <div className="px-6 py-12 text-center text-[13px]/[20px] text-ink-soft">
                  Loading…
                </div>
              ) : (
                <AuditRows logs={logs} />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
              <p className="text-[13px]/[20px] text-ink-soft">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="h-9 rounded-lg border border-line bg-surface px-3 text-[13px]/[20px] font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="h-9 rounded-lg border border-line bg-surface px-3 text-[13px]/[20px] font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
