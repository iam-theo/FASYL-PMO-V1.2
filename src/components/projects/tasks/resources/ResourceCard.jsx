import { avatarGradientFor, initialsFor } from "../../../../utils/avatar";

// Designation is only shown when it carries a real title — app-created
// resources store the role (e.g. "STAFF") or "N/A" there.
const JUNK_DESIGNATIONS = new Set([
  "N/A",
  "STAFF",
  "PROJECTMANAGER",
  "HEADOFOPS",
]);

const valueOrDash = (value) =>
  value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;

function ResourceCard({ resource, onRemove, index = 0 }) {
  const fullName =
    resource.fullName ||
    `${resource.firstName ?? ""} ${resource.lastName ?? ""}`.trim() ||
    resource.email ||
    "Team Member";

  const gradient = avatarGradientFor(fullName);

  const hasRealDesignation =
    resource.designation && !JUNK_DESIGNATIONS.has(String(resource.designation).trim().toUpperCase());

  const details = [
    {
      icon: "fa-solid fa-envelope",
      label: "Email",
      value: resource.email,
      tint: "bg-[#EEF4F6] text-[#1B3C4A]",
    },
    {
      icon: "fa-solid fa-phone",
      label: "Phone",
      value: resource.phoneNumber,
      tint: "bg-[#F0FDF4] text-[#047857]",
    },
    {
      icon: "fa-solid fa-id-card",
      label: "Staff ID",
      value: resource.staffId,
      tint: "bg-[#EFF6FF] text-[#1D4ED8]",
    },
    ...(hasRealDesignation
      ? [
          {
            icon: "fa-solid fa-briefcase",
            label: "Designation",
            value: resource.designation,
            tint: "bg-[#FAF5FF] text-[#7C3AED]",
          },
        ]
      : []),
  ];

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-[#FFFFFF] shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-[#1B3C4A]/20 hover:shadow-card-hover animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      {/* Gradient accent strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-[15px]/[18px] font-semibold text-[#FFFFFF] shadow-card`}
              >
                {initialsFor(fullName)}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#FFFFFF] bg-[#12B76A]"></span>
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[15px]/[20px] font-semibold text-ink">
                {fullName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {hasRealDesignation ? (
                  <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[10px]/[14px] font-semibold text-[#1B3C4A]">
                    {resource.designation}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#F2F4F7] px-2 py-0.5 text-[10px]/[14px] font-semibold text-[#475467]">
                    Resource
                  </span>
                )}
                {resource.recordId && (
                  <span className="inline-flex items-center rounded-full bg-[#FFFFFF] px-2 py-0.5 text-[10px]/[14px] font-medium text-ink-muted ring-1 ring-inset ring-line">
                    {resource.recordId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(resource)}
              aria-label={`Remove ${fullName}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-[#FFFFFF] text-ink-muted cursor-pointer transition-all hover:border-[#FECDCA] hover:bg-[#FEF3F2] hover:text-[#D20019]"
            >
              <i className="fa-solid fa-user-minus text-[12px]"></i>
            </button>
          )}
        </div>

        {/* Detail rows */}
        <div className="mt-5 flex flex-col gap-2">
          {details.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] px-3 py-2.5 ring-1 ring-inset ring-line-soft"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.tint}`}
              >
                <i className={`${row.icon} text-[12px]`}></i>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px]/[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  {row.label}
                </p>
                <p className="mt-0.5 truncate text-[13px]/[18px] font-medium text-ink">
                  {valueOrDash(row.value)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-line-soft pt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px]/[14px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              <i className="fa-solid fa-users text-[9px]"></i>
              Project resource
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px]/[14px] font-medium text-ink-muted">
              <i className="fa-solid fa-circle-check text-[9px] text-[#12B76A]"></i>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceCard;
