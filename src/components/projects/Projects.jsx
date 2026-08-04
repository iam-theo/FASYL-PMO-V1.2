function Projects({
  currentProjects,
  searchValue,
  setSearchValue,
  filterValue,
  setFilterValue,
  currentPage,
  totalPages,
  setCurrentPage,
  setSelectedProject,
  user,
  isLoading,
  setOpenProject,
  setActiveSubTab,
}) {
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
    UNASSIGNED: {
      bg: "#F2F4F7",
      text: "#475467",
    },

    OPEN: {
      bg: "#EFF8FF",
      text: "#175CD3",
    },

    SUBMITTED: {
      bg: "#FFF7ED",
      text: "#C4320A",
    },

    APPROVED: {
      bg: "#ECFDF3",
      text: "#067647",
    },

    REJECTED: {
      bg: "#FEF3F2",
      text: "#B42318",
    },

    COMPLETED: {
      bg: "#F0FDF4",
      text: "#15803D",
    },
  };

  const setCurrentStage = (currentStage) => {
    return STAGES[currentStage] || "LOCKED";
  };

  if (isLoading)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-18 h-18 rounded-full border-8 border-line border-t-primary animate-spin"></div>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-1 flex items-center gap-1.5 text-[13px]/[20px] text-ink-muted">
        <span>Home</span>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-primary">Projects</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="py-2">
          <h3 className="text-[20px]/[28px] font-semibold tracking-tight text-ink">
            Projects
          </h3>
          <p className="mt-1 text-[14px]/[22px] text-ink-soft">
            View all assigned projects
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex h-10 flex-1 items-center gap-3 rounded-lg border border-line bg-surface px-3.5 transition-colors focus-within:border-accent sm:w-72">
            <i className="fa-solid fa-magnifying-glass text-ink-muted"></i>
            <input
              type="text"
              value={searchValue}
              onInput={(e) => setSearchValue(e.target.value)}
              placeholder="Search projects..."
              className="outline-none w-full min-w-0 bg-transparent text-[14px]/[20px] text-ink placeholder:text-ink-muted"
            />
          </div>

          <div className="relative h-10 shrink-0 rounded-lg border border-line bg-surface px-3 text-[13px]/[20px] font-medium text-primary transition-colors focus-within:border-accent">
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="h-full w-full appearance-none bg-transparent pr-6 outline-none cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {currentProjects.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[840px] border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-20 bg-line-soft/60">
                <tr>
                  <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    ID
                  </th>
                  <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Project Name
                  </th>
                  <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Client
                  </th>
                  <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Product
                  </th>
                  {user?.role === "HEADOFOPS" && (
                    <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                      PM
                    </th>
                  )}
                  <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-soft">
                    Stage
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line-soft">
                {currentProjects.map((project, index) => (
                  <tr
                    key={index}
                    className="cursor-pointer transition-colors hover:bg-line-soft/40"
                    onClick={() => {
                      setOpenProject(true);
                      setSelectedProject(project);
                      setActiveSubTab("overview");
                    }}
                  >
                    <td className="px-5 py-4 text-[14px]/[20px] font-medium text-ink-soft">
                      {project.projectId}
                    </td>
                    <td
                      title={project.projectName}
                      className="max-w-[240px] truncate px-5 py-4 text-[14px]/[20px] font-medium text-ink"
                    >
                      {project.projectName}
                    </td>
                    <td
                      title={project.clientName}
                      className="max-w-[200px] truncate px-5 py-4 text-[14px]/[20px] text-ink-soft"
                    >
                      {project.clientName}
                    </td>
                    <td
                      title={project.productName}
                      className="max-w-[200px] truncate px-5 py-4 text-[14px]/[20px] text-ink-soft"
                    >
                      {project.productName}
                    </td>
                    {user?.role === "HEADOFOPS" && (
                      <td
                        title={project.projectManager?.email}
                        className="max-w-[220px] truncate px-5 py-4 text-[14px]/[20px] text-ink-soft"
                      >
                        {!project.projectManager?.email
                          ? "Not Assigned"
                          : project.projectManager?.email}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium"
                        style={{
                          backgroundColor:
                            statusStyles[project?.workflowStatus]?.bg,
                          color: statusStyles[project?.workflowStatus]?.text,
                        }}
                      >
                        {project?.workflowStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium ${
                          setCurrentStage(project.currentStageOrder) !==
                          "LOCKED"
                            ? "bg-[#EFF8FF] text-[#175CD3]"
                            : "bg-[#52525B] text-[#F4F4F5]"
                        }`}
                      >
                        {setCurrentStage(project.currentStageOrder)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-line-soft">
              <i className="fa-solid fa-folder-open text-[26px] text-ink-muted"></i>
            </div>
            <div>
              <h3 className="text-[16px]/[24px] font-semibold text-ink">
                No projects found
              </h3>
              <p className="mt-1 text-[14px]/[22px] text-ink-soft">
                Try adjusting your search or filter to find what you're looking
                for.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 w-full py-6">
        <p className="text-[14px]/[20px] text-ink-soft">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px]/[20px] font-medium text-primary shadow-card transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px]/[20px] font-medium text-primary shadow-card transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Projects;
