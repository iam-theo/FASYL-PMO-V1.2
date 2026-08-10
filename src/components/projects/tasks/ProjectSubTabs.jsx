export const PROJECT_WORKSPACE_TABS = [
  { key: "overview", label: "Overview" },
  { key: "project_lifecycle", label: "Project Lifecycle" },
  { key: "resources", label: "Resources" },
  { key: "tasks", label: "Tasks" },
  { key: "calendar", label: "Calendar" },
  // { key: "timeline", label: "Timeline" },
  { key: "reports", label: "Reports" },
];

// Tasks (a task view) is visible to all roles; the calendar, reports and
// project lifecycle are restricted to PM/HOPS.
const RESTRICTED_WORKSPACE_TABS = new Set(["calendar", "reports", "project_lifecycle"]);
const TASK_REPORT_ROLES = ["HEADOFOPS", "PROJECTMANAGER"];

function ProjectSubTabs({ activeTab, onTabChange, user }) {
  const visibleTabs = PROJECT_WORKSPACE_TABS.filter(
    (tab) =>
      !RESTRICTED_WORKSPACE_TABS.has(tab.key) ||
      TASK_REPORT_ROLES.includes(user?.role),
  );

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {visibleTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`shrink-0 md:flex-1 rounded-lg px-4 py-2.5 text-center font-medium text-[14px]/[20px] cursor-pointer whitespace-nowrap ${
            activeTab === tab.key
              ? "border border-[#0000000D] bg-[#E8E8E8] text-[#1B3C4A]"
              : "text-[#636363] hover:text-[#1B3C4A]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ProjectSubTabs;
