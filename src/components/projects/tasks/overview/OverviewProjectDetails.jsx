import { getCurrentStageName } from "../reports/analytics";

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

const formatDate = (value) =>
  value ? new Date(value).toDateString() : "N/A";

function OverviewProjectDetails({ project }) {
  const currentStage =
    getCurrentStageName(project) ||
    STAGES[project?.currentStageOrder] ||
    `Stage ${project?.currentStageOrder ?? 1}`;

  const details = [
    {
      icon: "fa-solid fa-user-tie",
      label: "Project Manager",
      value: project?.projectManager?.fullName || "Not Assigned",
    },
    {
      icon: "fa-solid fa-building",
      label: "Client",
      value: project?.clientName || "N/A",
    },
    {
      icon: "fa-solid fa-square-poll-horizontal",
      label: "Type",
      value: project?.productType || "N/A",
    },
    {
      icon: "fa-brands fa-product-hunt",
      label: "Product",
      value: project?.productName || "N/A",
    },
    {
      icon: "fa-solid fa-globe",
      label: "Location",
      value: project?.location || "N/A",
    },
    {
      icon: "fa-solid fa-qrcode",
      label: "Project ID",
      value: project?.projectId || "N/A",
    },
    {
      icon: "fa-solid fa-diagram-project",
      label: "Current Stage",
      value: currentStage,
    },
    {
      icon: "fa-solid fa-circle-check",
      label: "Workflow Status",
      value: String(project?.workflowStatus || "UNASSIGNED").replace(/_/g, " "),
    },
    {
      icon: "fa-solid fa-percent",
      label: "AMC",
      value: project?.amcPercentage != null ? `${project.amcPercentage}%` : "N/A",
    },
    {
      icon: "fa-solid fa-calendar-days",
      label: "Start Date",
      value: formatDate(project?.startDate),
    },
    {
      icon: "fa-solid fa-flag-checkered",
      label: "End Date",
      value: formatDate(project?.endDate),
    },
    {
      icon: "fa-solid fa-file-signature",
      label: "Purchase Order Date",
      value: formatDate(project?.purchaseOrderDate),
    },
  ];

  return (
    <div className="w-full rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-semibold text-[18px]/[26px] text-[#090909] truncate">
            {project?.projectName}
          </h3>
          <span className="font-normal text-[14px]/[20px] text-[#636363]">
            {project?.projectId}
          </span>
        </div>
        {project?.commencementDate && (
          <span className="shrink-0 rounded-2xl px-2 py-1 bg-[#1B3C4A] font-medium text-[12px]/[18px] text-center text-[#FFFFFF]">
            Commenced {formatDate(project.commencementDate)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {details.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-[#0000000D] bg-[#FFFFFF] px-3.5 py-3"
          >
            <i className={`${icon} text-[#1B3C4A]`}></i>
            <div className="flex flex-col min-w-0">
              <span className="font-normal text-[12px]/[16px] text-[#636363]">
                {label}
              </span>
              <span
                className="font-medium text-[14px]/[20px] text-[#090909] truncate"
                title={value}
              >
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OverviewProjectDetails;
