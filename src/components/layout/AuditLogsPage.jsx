import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { useNotification } from "../NotificationContext";
import {
  FaRegFileLines,
  FaArrowLeft,
  FaArrowRight,
  FaMagnifyingGlass,
  FaRotateRight,
  FaRegClock,
} from "react-icons/fa6";

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

const ROLE_LABELS = {
  HEADOFOPS: "Head of Ops",
  PROJECTMANAGER: "Project Manager",
  STAFF: "Staff",
};

const PAGE_SIZES = [10, 25, 50, 100];

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

function RoleBadge({ role }) {
  const styles = {
    HEADOFOPS: "bg-primary-soft text-primary",
    PROJECTMANAGER: "bg-[#EFF8FF] text-[#175CD3]",
    STAFF: "bg-line-soft text-ink-soft",
  };
  const label = ROLE_LABELS[role] || role || "System";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px]/[14px] font-semibold uppercase tracking-wide whitespace-nowrap ${
        styles[role] || styles.STAFF
      }`}
    >
      {label}
    </span>
  );
}

/* Compact page-number window with ellipses (e.g. 1 … 4 5 6 … 12) */
function getPageItems(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const candidates = new Set([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...candidates]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items = [];
  let prev = 0;
  for (const page of sorted) {
    if (page - prev > 1) items.push(`gap-${page}`);
    items.push(page);
    prev = page;
  }

  return items;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-line-soft text-ink-muted">
        <FaRegClock className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-[15px]/[22px] font-semibold text-ink">No activity found</h3>
        <p className="mt-1 text-[13px]/[20px] text-ink-soft">
          Nothing matches the current filters. Try widening your search.
        </p>
      </div>
    </div>
  );
}

function AuditTable({ logs }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full min-w-[820px] text-left">
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
            <tr key={log.id} className="align-top transition-colors hover:bg-line-soft/40">
              <td className="px-5 py-4 whitespace-nowrap">
                <p className="text-[13px]/[20px] font-medium text-ink">
                  {formatFullDate(log.createdAt)}
                </p>
                <p className="mt-0.5 text-[11px]/[14px] text-ink-muted">
                  {new Date(log.createdAt).toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </p>
              </td>
              <td className="px-5 py-4">
                <div className="flex max-w-[200px] flex-col items-start gap-1">
                  <p className="truncate text-[13px]/[20px] font-medium text-ink">
                    {actorLabel(log.user)}
                  </p>
                  {log.user?.email && (
                    <p className="truncate text-[12px]/[16px] text-ink-muted">
                      {log.user.email}
                    </p>
                  )}
                  <RoleBadge role={log.user?.role} />
                </div>
              </td>
              <td className="px-5 py-4">
                <ModuleBadge module={log.module} />
              </td>
              <td className="px-5 py-4">
                <p className="text-[13px]/[20px] font-medium text-ink">{log.action}</p>
                {parseDetails(log.details) && (
                  <p className="mt-0.5 max-w-[340px] truncate text-[12px]/[18px] text-ink-muted">
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

function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const navButton =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[13px]/[20px] font-medium text-ink-soft transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";

  return (
    <div className="flex flex-col gap-3 border-t border-line bg-surface px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-[13px]/[20px] text-ink-soft">
          Showing <span className="font-semibold text-ink">{start}–{end}</span> of{" "}
          <span className="font-semibold text-ink">{total}</span>
        </p>
        <span aria-hidden="true" className="h-4 w-px bg-line" />
        <div className="flex items-center gap-2">
          <label className="text-[12px]/[16px] text-ink-muted">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-line bg-surface px-2 text-[13px]/[20px] text-ink outline-none cursor-pointer"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={navButton}
        >
          <FaArrowLeft className="h-3 w-3" />
          Prev
        </button>

        {getPageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1 text-[13px]/[20px] text-ink-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[13px]/[20px] font-semibold transition-colors cursor-pointer ${
                item === page
                  ? "bg-primary text-white"
                  : "border border-line bg-surface text-ink-soft hover:border-primary/40 hover:text-primary"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={navButton}
        >
          Next
          <FaArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [module, setModule] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Debounce the search box so we don't hammer the API per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/audit", {
          params: {
            page,
            pageSize,
            module: module || undefined,
            search: debouncedSearch || undefined,
          },
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
  }, [page, module, debouncedSearch, pageSize, showNotification]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize]);

  const refresh = () => {
    const params = {
      page,
      pageSize,
      module: module || undefined,
      search: debouncedSearch || undefined,
    };
    api
      .get("/audit", { params, skipLoader: true })
      .then(({ data }) => {
        setLogs(data.data.logs);
        setTotal(data.data.total);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[13px]/[20px] text-ink-muted">
            <span>Home</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-primary">Audit Logs</span>
          </div>
          <h1 className="text-[22px]/[30px] font-semibold tracking-tight text-ink">
            Audit Logs
          </h1>
          <p className="mt-1 text-[14px]/[22px] text-ink-soft">
            Every action taken on the portal, with who did it and when
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px]/[20px] font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft cursor-pointer"
          >
            <FaRotateRight className="h-3.5 w-3.5" />
            Refresh
          </button>
          <div className="rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px]/[20px]">
            <span className="font-semibold text-ink">{total}</span>{" "}
            <span className="text-ink-soft">
              log{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor or email…"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-[13px]/[20px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setModule("");
              setPage(1);
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px]/[16px] font-medium transition-colors cursor-pointer ${
              module === ""
                ? "bg-primary text-white"
                : "border border-line bg-surface text-ink-soft hover:border-primary/40 hover:text-primary"
            }`}
          >
            All modules
          </button>
          {MODULES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModule(m);
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px]/[16px] font-medium transition-colors cursor-pointer ${
                module === m
                  ? "bg-primary text-white"
                  : "border border-line bg-surface text-ink-soft hover:border-primary/40 hover:text-primary"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {loading && logs.length === 0 ? (
          <div className="px-6 py-16 text-center text-[13px]/[20px] text-ink-soft">
            Loading activity…
          </div>
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FaRegFileLines className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[15px]/[22px] font-semibold text-ink">Activity Log</h3>
                <p className="text-[13px]/[20px] text-ink-soft">
                  {total} recorded action{total === 1 ? "" : "s"}
                  {module ? ` in ${module}` : ""}
                  {debouncedSearch ? ` matching “${debouncedSearch}”` : ""}
                </p>
              </div>
            </div>

            <AuditTable logs={logs} />

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
