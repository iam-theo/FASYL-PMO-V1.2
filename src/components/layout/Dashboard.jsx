import { FaEllipsisV, FaLock } from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../api";
import AuditLogPanel from "./AuditLogPanel";
import { useRealtimeModule } from "../../realtimeData";

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.50004 5C7.50004 5 12.5 8.68242 12.5 10C12.5 11.3177 7.5 15 7.5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersStatIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.6161 20H19.1063C20.2561 20 21.1707 19.4761 21.9919 18.7436C24.078 16.8826 19.1741 15 17.5 15M15.5 5.06877C15.7271 5.02373 15.9629 5 16.2048 5C18.0247 5 19.5 6.34315 19.5 8C19.5 9.65685 18.0247 11 16.2048 11C15.9629 11 15.7271 10.9763 15.5 10.9312"
        stroke="#228CEE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.48131 16.1112C3.30234 16.743 0.211139 18.0331 2.09388 19.6474C3.01359 20.436 4.03791 21 5.32572 21H12.6743C13.9621 21 14.9864 20.436 15.9061 19.6474C17.7889 18.0331 14.6977 16.743 13.5187 16.1112C10.754 14.6296 7.24599 14.6296 4.48131 16.1112Z"
        fill="#228CEE"
        fillOpacity="0.16"
        stroke="#228CEE"
        strokeWidth="1.5"
      />
      <path
        d="M13 7.5C13 9.70914 11.2091 11.5 9 11.5C6.79086 11.5 5 9.70914 5 7.5C5 5.29086 6.79086 3.5 9 3.5C11.2091 3.5 13 5.29086 13 7.5Z"
        fill="#228CEE"
        fillOpacity="0.16"
        stroke="#228CEE"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ScheduleStatIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.664 6.57831C19.6473 6.75667 19.8679 7.34313 20.1615 8.97048C20.4259 10.4361 20.5 12.1949 20.5 12.9436C20.4731 13.2195 20.3532 13.477 20.1615 13.687C18.1054 15.722 14.0251 19.565 11.9657 21.474C11.1575 22.1555 9.93819 22.1702 9.08045 21.5447C7.32407 20.0526 5.63654 18.366 3.98343 16.8429C3.3193 16.035 3.33487 14.8866 4.0585 14.1255C6.23711 11.9909 10.1793 8.33731 12.4047 6.31887C12.6278 6.1383 12.9012 6.02536 13.1942 6C13.6935 5.99988 14.5501 6.06327 15.3845 6.10896"
        fill="#08BD66"
        fillOpacity="0.16"
      />
      <path
        d="M18.664 6.57831C19.6473 6.75667 19.8679 7.34313 20.1615 8.97048C20.4259 10.4361 20.5 12.1949 20.5 12.9436C20.4731 13.2195 20.3532 13.477 20.1615 13.687C18.1054 15.722 14.0251 19.565 11.9657 21.474C11.1575 22.1555 9.93819 22.1702 9.08045 21.5447C7.32407 20.0526 5.63654 18.366 3.98343 16.8429C3.3193 16.035 3.33487 14.8866 4.0585 14.1255C6.23711 11.9909 10.1793 8.33731 12.4047 6.31887C12.6278 6.1383 12.9012 6.02536 13.1942 6C13.6935 5.99988 14.5501 6.06327 15.3845 6.10896"
        stroke="#08BD66"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.72852 15.2861H12.7285M10.2271 12.7861H10.2364M10.2294 17.7861H10.2388"
        stroke="#08BD66"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 3.69682C9.53332 6.78172 14.5357 0.12372 17.4957 2.53998C19.1989 3.93028 18.6605 7 16.4494 9"
        stroke="#08BD66"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockStatIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#F59E0B"
        fillOpacity="0.16"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      <path
        d="M12 7.5V12L14.75 14"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleStatIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#10B981"
        fillOpacity="0.16"
        stroke="#10B981"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 12.2L11.2 14.9L15.8 9.8"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2.5"
        y="7"
        width="19"
        height="13"
        rx="2"
        stroke="#1B3C4A"
        strokeWidth="1.5"
      />
      <path
        d="M8 7V5.5C8 4.4 8.9 3.5 10 3.5H14C15.1 3.5 16 4.4 16 5.5V7"
        stroke="#1B3C4A"
        strokeWidth="1.5"
      />
      <path d="M2.5 12.5H21.5" stroke="#1B3C4A" strokeWidth="1.5" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8.5C3 5.74165 3 4.36248 3.87868 3.48424C4.75736 2.606 6.13711 2.606 8.89661 2.606H15.1034C17.8629 2.606 19.2426 2.606 20.1213 3.48424C21 4.36248 21 5.74165 21 8.5V15.5C21 18.2583 21 19.6375 20.1213 20.5158C19.2426 21.394 17.8629 21.394 15.1034 21.394H8.89661C6.13711 21.394 4.75736 21.394 3.87868 20.5158C3 19.6375 3 18.2583 3 15.5V8.5Z"
        stroke="#5B6470"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 17H7.66574C8.31643 17 8.90273 17.3985 9.16423 18.0062C9.53251 18.8543 10.35892 19.412 11.2775 19.412H12.7225C13.6411 19.412 14.4675 18.8543 14.8358 18.0062C15.0973 17.3985 15.6836 17 16.3343 17H21"
        stroke="#5B6470"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ label, value, caption, icon, chipClass, footerClass, onClick }) {
  const card = (
    <div className="h-full rounded-2xl border border-line bg-surface p-5 text-left shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px]/[20px] font-medium text-ink-soft">{label}</p>
          <p className="mt-2 text-[32px]/[38px] font-semibold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chipClass}`}
        >
          {icon}
        </div>
      </div>
      <div
        className={`mt-5 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[13px]/[20px] font-medium ${footerClass}`}
      >
        <span className="truncate">{caption}</span>
      </div>
    </div>
  );

  if (!onClick) return card;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group cursor-pointer text-left transition-all hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {card}
    </button>
  );
}

const STAGES = {
  1: "Client ID",
  2: "Engagement",
  3: "Initiation",
  4: "Planning",
  5: "Execution",
  6: "UAT",
  7: "Go-Live",
  8: "Closure",
};

const statusStyles = {
  UNASSIGNED: { bg: "#F2F4F7", text: "#475467" },
  OPEN: { bg: "#EFF8FF", text: "#175CD3" },
  SUBMITTED: { bg: "#FFF6ED", text: "#C4320A" },
  APPROVED: { bg: "#ECFDF3", text: "#067647" },
  REJECTED: { bg: "#FEF3F2", text: "#B42318" },
  COMPLETED: { bg: "#F0FDF4", text: "#15803D" },
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.UNASSIGNED;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  );
}

function StageBadge({ stage }) {
  const label = STAGES[stage] || "Unknown";
  const locked = label === "LOCKED";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium ${
        locked ? "bg-[#52525B] text-[#F4F4F5]" : "bg-[#EFF8FF] text-[#175CD3]"
      }`}
    >
      {label}
    </span>
  );
}

function Dashboard({
  projects,
  user,
  setActiveTab,
  setSelectedProject,
  setOpenProject,
  setActiveSubTab,
}) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  const [taskCount, setTaskCount] = useState(0);

  // Count of tasks assigned to the logged-in user. The backend resolves the
  // assignment by role: PM/HOPS via assignedToUserId, STAFF via the project
  // resources they are a member of.
  const loadTaskCount = useCallback(async () => {
    try {
      const { data } = await api.get("/tasks/my-count");
      setTaskCount(data.data ?? 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadTaskCount();
  }, [loadTaskCount]);

  // Tasks change live while the dashboard is open (created by the user or by a
  // teammate) — keep the "My tasks" count fresh.
  useRealtimeModule("Tasks", loadTaskCount);

  const filteredProjects = safeProjects.filter((project) => {
    if (user?.role === "HEADOFOPS") {
      return true; // sees everything
    }

    if (user?.role === "PROJECTMANAGER") {
      return project.projectManager?.email === user.email;
      // only projects assigned
    }

    if (user?.role === "STAFF") {
      const email = (user.email || "").toLowerCase();

      // Staff are project resources; only show the projects they are on.
      return (Array.isArray(project.resources) ? project.resources : []).some(
        (resource) => (resource.email || "").toLowerCase() === email,
      );
    }

    return false;
  });

  const activeProjects = filteredProjects
    .filter(
      (project) =>
        !["COMPLETED", "OPEN", "UNASSIGNED"].includes(project.workflowStatus),
    )
    .slice(0, 10);

  const isHeadOfOps = user?.role === "HEADOFOPS";

  const portfolio = {
    total: safeProjects.length,
    inProgress: safeProjects.filter(
      (project) => project.workflowStatus === "APPROVED",
    ).length,
    awaitingApproval: safeProjects.filter(
      (project) => project.workflowStatus === "SUBMITTED",
    ).length,
    completed: safeProjects.filter(
      (project) => project.workflowStatus === "COMPLETED",
    ).length,
    open: safeProjects.filter(
      (project) => project.workflowStatus === "OPEN",
    ).length,
    rejected: safeProjects.filter(
      (project) => project.workflowStatus === "REJECTED",
    ).length,
    unassigned: safeProjects.filter(
      (project) => project.workflowStatus === "UNASSIGNED",
    ).length,
    clients: new Set(
      safeProjects.map((project) => project.clientName).filter(Boolean),
    ).size,
  };

  const [openProjectMenu, setOpenProjectMenu] = useState(null);

  const firstName = (user?.fullName || "").split(" ")[0] || "there";

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[13px]/[20px] text-ink-muted">
            <span>Home</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-[22px]/[30px] font-semibold tracking-tight text-ink">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-[14px]/[22px] text-ink-soft">
            Here's an overview of all your activities.
          </p>
        </div>
      </div>

      {/* Analytics metric cards */}
      {isHeadOfOps ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Projects"
              value={portfolio.total}
              caption="All projects in the portfolio"
              icon={<UsersStatIcon />}
              chipClass="bg-[#EFF8FF]"
              footerClass="text-primary"
              onClick={() => setActiveTab("projects")}
            />
            <MetricCard
              label="In Progress"
              value={portfolio.inProgress}
              caption="Approved and in delivery"
              icon={<ScheduleStatIcon />}
              chipClass="bg-[#EAF9F1]"
              footerClass="text-ink-muted"
            />
            <MetricCard
              label="Awaiting Approval"
              value={portfolio.awaitingApproval}
              caption="Submitted for your review"
              icon={<ClockStatIcon />}
              chipClass="bg-[#FFFAEB]"
              footerClass="text-ink-muted"
            />
            <MetricCard
              label="Completed"
              value={portfolio.completed}
              caption="Delivered and closed out"
              icon={<CheckCircleStatIcon />}
              chipClass="bg-[#ECFDF3]"
              footerClass="text-ink-muted"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                <BriefcaseIcon />
              </div>
              <div>
                <p className="text-[15px]/[22px] font-semibold text-ink">
                  {portfolio.clients} unique clients
                </p>
                <p className="text-[13px]/[20px] text-ink-soft">
                  Across your project portfolio
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[13px]/[20px] text-ink-soft">
              <span>
                <span className="font-semibold text-ink">
                  {portfolio.open}
                </span>{" "}
                open
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-line" />
              <span>
                <span className="font-semibold text-ink">
                  {portfolio.rejected}
                </span>{" "}
                rejected
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-line" />
              <span>
                <span className="font-semibold text-ink">
                  {portfolio.unassigned}
                </span>{" "}
                unassigned
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className="group cursor-pointer rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px]/[20px] font-medium text-ink-soft">
                  Assigned Projects
                </p>
                <p className="mt-2 text-[32px]/[38px] font-semibold tracking-tight text-ink">
                  {filteredProjects.length}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF8FF]">
                <UsersStatIcon />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[13px]/[20px] font-medium text-primary transition-colors group-hover:text-accent">
              View projects
              <ChevronIcon />
            </div>
          </button>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px]/[20px] font-medium text-ink-soft">
                  Assigned Tasks
                </p>
                <p className="mt-2 text-[32px]/[38px] font-semibold tracking-tight text-ink">
                  {taskCount}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF9F1]">
                <ScheduleStatIcon />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[13px]/[20px] font-medium text-ink-muted">
              Currently assigned to you
            </div>
          </div>
        </div>
      )}

      {/* Active projects table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[15px]/[22px] font-semibold text-ink">
              Active Projects
            </h3>
            <p className="text-[13px]/[20px] text-ink-soft">
              Projects currently in progress
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px]/[20px] font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft cursor-pointer"
          >
            See All
            <ChevronIcon />
          </button>
        </div>

        {activeProjects.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-line-soft/60">
                <tr>
                  <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    ID
                  </th>
                  <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Project
                  </th>
                  <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Client
                  </th>
                  {user?.role === "HEADOFOPS" && (
                    <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                      Project Manager
                    </th>
                  )}
                  <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Stage
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {activeProjects.map((project) => (
                  <tr
                    key={project.projectId}
                    className="group cursor-pointer transition-colors hover:bg-line-soft/40"
                    onClick={() => {
                      setOpenProject(true);
                      setSelectedProject(project);
                      setActiveSubTab("overview");
                    }}
                  >
                    <td className="px-5 py-4 text-[13px]/[20px] font-medium text-ink-soft">
                      {project.projectId}
                    </td>
                    <td className="px-5 py-4">
                      <p
                        title={project.projectName}
                        className="max-w-[220px] truncate text-[14px]/[22px] font-medium text-ink"
                      >
                        {project.projectName}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p
                        title={project.clientName}
                        className="max-w-[180px] truncate text-[14px]/[22px] text-ink-soft"
                      >
                        {project.clientName}
                      </p>
                    </td>
                    {user?.role === "HEADOFOPS" && (
                      <td className="px-5 py-4">
                        <p
                          title={project.projectManager?.email}
                          className="max-w-[200px] truncate text-[14px]/[22px] text-ink-soft"
                        >
                          {project.projectManager?.email || "Not Assigned"}
                        </p>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <StatusBadge status={project?.workflowStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <StageBadge stage={project.currentStageOrder} />
                    </td>
                    <td className="px-5 py-4 text-right relative">
                      <button
                        type="button"
                        aria-label="Project actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (project.projectManager === null) {
                            return setSelectedProject(project);
                          }
                          if (project.currentStageOrder === undefined) return;
                          setOpenProjectMenu((prev) =>
                            prev === project.projectId
                              ? null
                              : project.projectId,
                          );
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-line-soft hover:text-primary cursor-pointer"
                      >
                        <FaEllipsisV />
                      </button>

                      {openProjectMenu === project.projectId && (
                        <div className="absolute right-5 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-line bg-surface py-1 text-[13px]/[20px] shadow-popover">
                          {project.stages?.map((stage) => (
                            <button
                              key={stage.id}
                              type="button"
                              className="flex w-full items-center justify-between gap-6 px-4 py-2 text-left transition-colors hover:bg-line-soft"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (stage.workflowStatus === "LOCKED") return;
                                setSelectedProject(project);
                                setOpenProjectMenu(null);
                              }}
                            >
                              <span className="font-medium text-ink">
                                {STAGES[stage.stageOrder] || "Unknown"}
                              </span>
                              <FaLock
                                className={
                                  stage.workflowStatus !== "LOCKED"
                                    ? "hidden"
                                    : "text-ink-muted"
                                }
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-line-soft">
              <InboxIcon />
            </div>
            <div>
              <h3 className="text-[16px]/[24px] font-semibold text-ink">
                No active projects
              </h3>
              <p className="mt-1 text-[14px]/[22px] text-ink-soft">
                You don't have any active projects right now.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Activity audit trail (Head of Operations only) */}
      {isHeadOfOps && (
        <div className="mt-6">
          <AuditLogPanel onViewAll={() => setActiveTab("audit")} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
