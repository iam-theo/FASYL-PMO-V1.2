import { useEffect, useRef, useState } from "react";
import { FileDown, SquareChartGantt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LifecycleTracker from "./LifecycleTracker";
import DonutChart from "./DonutChart";
import TaskCompletionTrend from "./TaskCompletionTrend";
import UpcomingTaskReminder from "./UpcomingTaskReminder";
import { buildStatusItems, buildAllocationItems, getProjectResources } from "./analytics";
import { exportProjectAnalytics } from "./exportAnalytics";

function ExportDropdown({ project, tasks, user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format) => {
    setOpen(false);
    exportProjectAnalytics(format, { project, tasks, user });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="px-4 py-2 rounded-md border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer"
      >
        <FileDown size={18} className="text-[#090909]" />
        <span className="font-medium text-[14px]/[20px] text-[#1B3C4A]">Export Analytics</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-[#0000000D] bg-[#FFFFFF] shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)] overflow-hidden">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="w-full px-4 py-2.5 text-left font-medium text-[14px]/[20px] text-[#1B3C4A] hover:bg-[#E8E8E8] cursor-pointer"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport("excel")}
            className="w-full px-4 py-2.5 text-left font-medium text-[14px]/[20px] text-[#1B3C4A] hover:bg-[#E8E8E8] cursor-pointer"
          >
            Excel
          </button>
        </div>
      )}
    </div>
  );
}

const RESOURCE_TABLE_COLUMNS = [
  { label: "Staff", key: (resource) => `${resource?.firstName ?? ""} ${resource?.lastName ?? ""}`.trim() },
  { label: "Staff ID", key: (resource) => resource?.staffId ?? "—" },
  { label: "Designation", key: (resource) => resource?.designation ?? "—" },
  { label: "Phone", key: (resource) => resource?.phoneNumber ?? "—" },
  { label: "Email", key: (resource) => resource?.email ?? "—" },
];

function ResourcesTable({ resources }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[16px]/[20px] text-[#090909]">Project Resources</h3>
        <span className="font-normal text-[14px]/[20px] text-[#636363]">
          {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      {resources.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-[#0000000D] bg-[#F9FAFB] font-normal text-[14px]/[20px] text-[#636363]">
          No resources assigned to this project yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#0000000D] bg-[#F9FAFB]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#0000000D]">
                {RESOURCE_TABLE_COLUMNS.map((column) => (
                  <th
                    key={column.label}
                    className="h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr
                  key={resource?.recordId ?? resource?.staffId}
                  className="border-b border-[#0000000D] last:border-b-0"
                >
                  {RESOURCE_TABLE_COLUMNS.map((column) => (
                    <td
                      key={column.label}
                      className="h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap"
                    >
                      {column.key(resource)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ project, tasks, user }) {
  const navigate = useNavigate();
  const taskList = Array.isArray(tasks) ? tasks : [];
  const resources = getProjectResources(project);

  const statusItems = buildStatusItems(taskList);
  const allocationItems = buildAllocationItems(taskList);

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-[18px]/[24px] text-[#090909]">Project Analytics</h2>

        <div className="flex items-center gap-3">
          <ExportDropdown project={project} tasks={taskList} user={user} />
          <button
            onClick={() => navigate("/app/reports")}
            className="px-4 py-2 rounded-md bg-[#1B3C4A] text-white hover:bg-[#092b3a] flex items-center gap-2 cursor-pointer"
          >
            <SquareChartGantt size={18} />
            Manage Reports
          </button>
        </div>
      </div>

      <LifecycleTracker project={project} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart title="Task Status Overview" items={statusItems} />
        <TaskCompletionTrend tasks={taskList} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingTaskReminder tasks={taskList} />
        <DonutChart title="Task Allocation by Resource" items={allocationItems} />
      </div>

      <ResourcesTable resources={resources} />
    </div>
  );
}

export default ReportsTab;
