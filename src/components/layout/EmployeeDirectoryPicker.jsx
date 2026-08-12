import { useEffect, useMemo, useRef, useState } from "react";
import { avatarGradientFor, initialsFor } from "../../utils/avatar";

/**
 * Searchable staff-directory picker used by the Add Project Manager modal.
 * Picking an employee auto-fills the account form. Supports type-to-filter,
 * arrow-key navigation, and Enter/Escape.
 */
function EmployeeDirectoryPicker({ employees, loading, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((employee) =>
      [
        employee.fullName,
        employee.email,
        employee.staffId,
        employee.designation,
        employee.department,
        employee.unit,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [employees, query]);

  const openPicker = () => {
    setOpen(true);
    setHighlightIndex(0);
  };

  const select = (employee) => {
    onSelect(employee);
    setOpen(false);
    setQuery("");
  };

  // Close when clicking outside the picker.
  useEffect(() => {
    if (!open) return undefined;

    const onDocumentClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [open]);

  // Focus the search box the moment the panel opens.
  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  // Keep the highlight inside the visible list.
  useEffect(() => {
    if (highlightIndex >= filtered.length) setHighlightIndex(0);
  }, [filtered.length, highlightIndex]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) =>
        Math.min(index + 1, Math.max(filtered.length - 1, 0)),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === "Enter" && filtered[highlightIndex]) {
      event.preventDefault();
      select(filtered[highlightIndex]);
    }
  };

  const selectedId = value
    ? String(value.recordId || value.id)
    : null;

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-[#FFFFFF] px-3.5 text-left outline-none transition-all cursor-pointer ${
          open
            ? "border-[#1B3C4A] ring-2 ring-[#1B3C4A]/10 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
            : "border-[#D0D5DD] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:border-[#98A2B3]"
        }`}
      >
        {value ? (
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradientFor(
                value.fullName,
              )} text-[11px]/[14px] font-semibold text-[#FFFFFF]`}
            >
              {initialsFor(value.fullName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px]/[18px] font-medium text-ink">
                {value.fullName}
              </span>
              <span className="block truncate text-[11px]/[15px] text-ink-muted">
                {value.designation || value.email}
              </span>
            </span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D1FAE5]">
              <i className="fa-solid fa-check text-[9px] text-[#047857]"></i>
            </span>
          </>
        ) : (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft">
              <i className="fa-solid fa-magnifying-glass text-[13px] text-[#1B3C4A]"></i>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px]/[18px] font-medium text-ink">
                {loading ? "Loading the staff directory…" : "Search the staff directory"}
              </span>
              <span className="block truncate text-[11px]/[15px] text-ink-muted">
                Pick an employee to auto-fill their details
              </span>
            </span>
          </>
        )}

        <i
          className={`fa-solid fa-chevron-down ml-auto shrink-0 text-[11px] text-ink-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        ></i>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-[#FFFFFF] shadow-popover animate-fade-in-up">
          {/* Search */}
          <div className="border-b border-line-soft bg-[#F9FAFB] p-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#D0D5DD] bg-[#FFFFFF] px-3 py-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.04)] transition-colors focus-within:border-[#1B3C4A] focus-within:ring-2 focus-within:ring-[#1B3C4A]/10">
              <i className="fa-solid fa-magnifying-glass text-[12px] text-ink-muted"></i>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, email, staff ID or role…"
                className="w-full bg-transparent text-[13px]/[18px] text-ink outline-none placeholder:text-ink-muted"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-muted cursor-pointer hover:bg-[#E4E7EC] hover:text-ink"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              )}
            </div>
          </div>

          {/* List header */}
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <span className="text-[10px]/[14px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {loading ? "Loading" : "Staff directory"}
            </span>
            {!loading && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px]/[14px] font-semibold text-[#1B3C4A]">
                {filtered.length} {filtered.length === 1 ? "match" : "matches"}
              </span>
            )}
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto p-1.5 pb-2">
            {loading ? (
              <>
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2.5"
                  >
                    <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-line-soft"></span>
                    <span className="flex-1 space-y-1.5">
                      <span className="block h-2.5 w-2/5 animate-pulse rounded-full bg-line-soft"></span>
                      <span className="block h-2 w-3/5 animate-pulse rounded-full bg-[#F1F3F5]"></span>
                    </span>
                  </div>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F4F7]">
                  <i className="fa-solid fa-user-slash text-[16px] text-ink-muted"></i>
                </span>
                <p className="text-[13px]/[18px] font-medium text-ink">
                  No employees match “{query}”
                </p>
                <p className="text-[11px]/[16px] text-ink-muted">
                  Try a different name, email, or staff ID.
                </p>
              </div>
            ) : (
              filtered.map((employee, index) => {
                const isHighlighted = index === highlightIndex;
                const isSelected =
                  selectedId === String(employee.recordId || employee.id);

                return (
                  <button
                    type="button"
                    key={employee.recordId || employee.id}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => select(employee)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer animate-fade-in-up ${
                      isSelected
                        ? "bg-[#EEF4F6] ring-1 ring-inset ring-[#1B3C4A]/15"
                        : isHighlighted
                          ? "bg-line-soft/70"
                          : "hover:bg-line-soft/50"
                    }`}
                    style={{ animationDelay: `${Math.min(index, 8) * 16}ms` }}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradientFor(
                        employee.fullName,
                      )} text-[12px]/[16px] font-semibold text-[#FFFFFF]`}
                    >
                      {initialsFor(employee.fullName)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px]/[18px] font-medium text-ink">
                          {employee.fullName}
                        </span>
                        {employee.designation && (
                          <span className="hidden shrink-0 rounded-full bg-[#FFFFFF] px-2 py-0.5 text-[10px]/[14px] font-medium text-[#1B3C4A] ring-1 ring-inset ring-[#1B3C4A]/15 sm:inline-flex">
                            {employee.designation}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px]/[15px] text-ink-muted">
                        <span className="truncate">{employee.email}</span>
                        {employee.staffId && (
                          <>
                            <span className="shrink-0 text-line">•</span>
                            <span className="shrink-0 font-medium text-[#667085]">
                              {employee.staffId}
                            </span>
                          </>
                        )}
                      </span>
                    </span>

                    {isSelected && (
                      <i className="fa-solid fa-circle-check shrink-0 text-[16px] text-[#1B3C4A]"></i>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="flex items-center justify-between border-t border-line-soft bg-[#F9FAFB] px-4 py-2">
              <span className="text-[10px]/[14px] text-ink-muted">
                <i className="fa-solid fa-arrow-up-down mr-1 text-[9px]"></i>
                Arrow keys to navigate · Enter to select
              </span>
              <span className="text-[10px]/[14px] text-ink-muted">Esc to close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeeDirectoryPicker;
