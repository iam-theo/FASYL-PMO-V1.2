import { useEffect, useState, useCallback } from "react";
import { api } from "../../api";
import { useNotification } from "../NotificationContext";
import { FaRegFileLines, FaChevronRight } from "react-icons/fa6";
import { useRealtimeModule } from "../../realtimeData";

const moduleChipStyles = {
  Auth: "bg-[#EEF4FF] text-[#3538CD]",
  Projects: "bg-[#EFF8FF] text-[#175CD3]",
  Workflow: "bg-[#FFF6ED] text-[#C4320A]",
  Tasks: "bg-[#F0FDF4] text-[#15803D]",
  Reports: "bg-[#FFFAEB] text-[#B54708]",
  Reminders: "bg-[#FDF2FA] text-[#C11574]",
  Notifications: "bg-[#F2F4F7] text-[#475467]",
};

/* dd/mm/yyyy hh:mm:ss in the user's local timezone */
function formatFullDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export default function AuditLogPanel({ onViewAll }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/audit", {
        params: { page: 1, pageSize: 10 },
        skipLoader: true,
      });
      setLogs(data.data.logs);
      setTotal(data.data.total);
    } catch (err) {
      console.error(err);
      showNotification({
        type: "error",
        title: "Failed to load activity log",
        message: err.response?.data?.error || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    load();
  }, [load]);

  // Every successful mutating request becomes an audit row — refresh live.
  useRealtimeModule("*", load);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FaRegFileLines className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[15px]/[22px] font-semibold text-ink">
              Recent Activity
            </h3>
            <p className="text-[13px]/[20px] text-ink-soft">
              Every action taken on the portal, with who did it and when
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px]/[20px] font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft cursor-pointer"
        >
          View All ({total})
          <FaChevronRight className="h-3 w-3" />
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="px-6 py-12 text-center text-[13px]/[20px] text-ink-soft">
          Loading activity…
        </div>
      ) : logs.length === 0 ? (
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
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-line-soft/60">
              <tr>
                <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                  Timestamp
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
                  <td className="px-5 py-4 text-[13px]/[20px] whitespace-nowrap text-ink-soft">
                    {formatFullDate(log.createdAt)}
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
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium whitespace-nowrap ${
                        moduleChipStyles[log.module] || moduleChipStyles.Notifications
                      }`}
                    >
                      {log.module}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px]/[20px] font-medium text-ink">{log.action}</p>
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
      )}
    </div>
  );
}
