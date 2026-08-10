import { LifecycleCheckIcon } from "./icons";
import { getSortedStages, computeLifecycleProgress, isStageDone } from "./analytics";

const truncate = (value, max = 12) => {
  const text = String(value ?? "").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
};

function StepIcon({ status }) {
  if (status === "done") {
    return <LifecycleCheckIcon />;
  }

  if (status === "current") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B3C4A]">
        <div className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F7]">
      <div className="h-1.5 w-1.5 rounded-full bg-white" />
    </div>
  );
}

function LifecycleTracker({ project }) {
  const stages = getSortedStages(project);
  const currentStageOrder = project?.currentStageOrder ?? 0;

  const steps = stages.map((stage) => {
    const stageOrder = stage.stageOrder;
    let status = "pending";
    if (isStageDone(stage)) status = "done";
    else if (stageOrder === currentStageOrder) status = "current";

    return {
      key: String(stage.id ?? stageOrder),
      label: truncate(stage.stageName),
      status,
    };
  });

  const progressPercent = computeLifecycleProgress(project);

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-[#0000000D] bg-gray-50 p-4">
      <h3 className="font-semibold text-[16px]/[20px] text-[#090909]">
        Lifecycle Tracker
      </h3>

      {steps.length === 0 ? (
        <p className="font-normal text-[14px]/[20px] text-[#636363]">
          No lifecycle data for this project yet.
        </p>
      ) : (
        <div className="flex min-w-max items-start gap-4 overflow-x-auto no-scrollbar pb-1 sm:min-w-0 sm:justify-between">
          {steps.map((step) => (
            <div
              key={step.key}
              className="flex w-20 shrink-0 flex-col items-center gap-2"
            >
              <StepIcon status={step.status} />
              <span
                className={`text-center font-medium text-[12px]/[24px] ${
                  step.status === "current" ? "text-[#1B3C4A]" : "text-[#344054]"
                } ${step.status === "pending" ? "opacity-50" : ""}`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="shrink-0 font-medium text-[14px]/[24px] text-[#1B3C4A]">
          Overall Lifecycle Progress
        </span>
        <div className="h-2 flex-1 rounded-full bg-[#EFEFEF]">
          <div
            className="h-2 rounded-full bg-[#08BD66]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="shrink-0 font-semibold text-[14px]/[24px] text-[#1B3C4A]">
          {progressPercent}%
        </span>
      </div>
    </div>
  );
}

export default LifecycleTracker;
