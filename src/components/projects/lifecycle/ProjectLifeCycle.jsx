import UploadBox from './UploadBox';
import { Fragment, useState } from 'react';
import { toggleChecklist } from './utils/ToggleChecklist';
import { submitStage, approveStage, rejectStage } from '../../../api';
import { useNotification } from '../../NotificationContext';
import {
    FaRegCircleXmark,
    FaRegCircleCheck,
    FaCheck,
    FaArrowRight,
    FaSpinner,
    FaRegFileLines,
    FaListCheck,
    FaRegSquareCheck,
    FaRegClock,
} from 'react-icons/fa6';

const STAGES = {
    1: "Client ID",
    2: "Engagement",
    3: "Initiation",
    4: "Planning",
    5: "Execution",
    6: "UAT",
    7: "Go-Live",
    8: "Closure"
};

const STAGESDESC = {
    0: "Record and qualify the prospective client before any engagement begins.",
    1: "Pre-sales and proposal activities. All items must be complete before initiation.",
    2: "Mandatory pre-project documents per policy.",
    3: "Mandatory pre-project documents per policy.",
    4: "Track milestones and mandatory sign-offs at each delivery gate.",
    5: "Client-led testing. All critical issues must be resolved before go-live approval.",
    6: "Final production deployment. Requires all prior stage gates cleared.",
    7: "Final production deployment. Requires all prior stage gates cleared."
};

const WORKFLOW_META = {
    UNASSIGNED: { label: "Unassigned", pill: "bg-[#F2F4F7] text-[#475467]" },
    LOCKED: { label: "Locked", pill: "bg-[#F2F4F7] text-[#475467]" },
    OPEN: { label: "Open", pill: "bg-[#EFF8FF] text-[#175CD3]" },
    IN_PROGRESS: { label: "In Progress", pill: "bg-[#EFF8FF] text-[#175CD3]" },
    SUBMITTED: { label: "Pending Approval", pill: "bg-[#FFF7ED] text-[#C4320A]" },
    APPROVED: { label: "Approved", pill: "bg-[#ECFDF3] text-[#027A48]" },
    REJECTED: { label: "Rejected", pill: "bg-[#FEF3F2] text-[#B42318]" },
    COMPLETED: { label: "Completed", pill: "bg-[#ECFDF3] text-[#027A48]" },
};

const isStageDone = (stage) =>
    stage?.workflowStatus === "APPROVED" || stage?.workflowStatus === "COMPLETED";

function WorkflowBadge({ status }) {
    const meta = WORKFLOW_META[status] || {
        label: status || "—",
        pill: "bg-[#F2F4F7] text-[#475467]"
    };

    return (
        <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px]/[16px] font-medium ${meta.pill}`}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {meta.label}
        </span>
    );
}

function StageStepper({ steps }) {
    return (
        <div className="no-scrollbar -mx-1 py-2 mt-5 overflow-x-auto">
            <div className="flex min-w-max items-start px-1">
                {steps.map((step, i) => (
                    <Fragment key={step.order}>
                        <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${step.dotClass}`}>
                                {step.done && <FaCheck className="h-3 w-3 text-white" />}
                                {step.rejected && <FaRegCircleXmark className="h-3.5 w-3.5 text-white" />}
                                {step.current && <span className="h-2 w-2 rounded-full bg-accent" />}
                                {step.pending && <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3]" />}
                            </div>
                            <span className={`w-full truncate text-center text-[10px]/[12px] font-medium ${
                                step.done
                                    ? "text-ink"
                                    : step.current
                                        ? "text-accent"
                                        : step.rejected
                                            ? "text-[#D20019]"
                                            : "text-ink-muted"
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`mt-[13px] h-[3px] w-4 shrink-0 rounded-full ${step.done ? "bg-primary" : "bg-line"}`} />
                        )}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

function StatCard({ icon, tone, value, label }) {
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-card">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
                {icon}
            </span>
            <p className="text-[18px]/[22px] font-semibold text-ink">{value}</p>
            <p className="text-[11px]/[14px] font-medium text-ink-muted">{label}</p>
        </div>
    );
}

function SectionHeader({ icon, title, badge }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    {icon}
                </span>
                <h3 className="text-[15px]/[20px] font-semibold text-ink">{title}</h3>
            </div>
            {badge && (
                <span className="rounded-full bg-line px-2 py-0.5 text-[11px]/[14px] font-semibold text-ink-soft">
                    {badge}
                </span>
            )}
        </div>
    );
}

function RejectModal({ open, busy, reason, error, onReasonChange, onCancel, onConfirm }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[4000] flex items-center justify-center bg-[#0B1B24]/50 p-6"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-popover"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D20019]">
                        <FaRegCircleXmark className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-[16px]/[22px] font-semibold text-ink">Reject Stage Signoff</h3>
                        <p className="mt-1 text-[13px]/[18px] text-ink-soft">
                            This sends the signoff request back to the project manager. A reason is required so they can address the gaps.
                        </p>
                    </div>
                </div>

                <div className="mt-5">
                    <label className="mb-1.5 block text-[12px]/[16px] font-semibold text-ink">
                        Reason for rejection <span className="text-[#D20019]">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="e.g. The NDA document uploaded is not signed by the client..."
                        rows={4}
                        autoFocus
                        className={`w-full resize-none rounded-lg border bg-surface px-3.5 py-2.5 text-[13px]/[18px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                            error ? "border-[#D20019]" : "border-line"
                        }`}
                    />
                    {error && <p className="mt-1 text-[12px]/[16px] text-[#D20019]">{error}</p>}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-lg border border-line bg-surface px-4 py-2.5 text-[13px]/[18px] font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#D20019] px-4 py-2.5 text-[13px]/[18px] font-semibold text-white transition-colors hover:bg-[#A40014] disabled:opacity-50"
                    >
                        {busy && <FaSpinner className="h-3.5 w-3.5 animate-spin" />}
                        {busy ? "Rejecting..." : "Reject Signoff"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ProjectLifeCycle({
    selectedProject,
    setSelectedProject,
    setProjects,
    onClose,
    user,
}) {
    const { showNotification } = useNotification();
    const [busy, setBusy] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [rejecting, setRejecting] = useState(false);

    const getStageDesc = (stageIndex) => STAGESDESC[stageIndex] || "Unknown Desc";
    const getStage = (currentStageOrder) => STAGES[currentStageOrder] || "Unknown Stage";

    const currentStageOrder = selectedProject?.currentStageOrder;
    const projectStage =
        selectedProject?.stages?.find((s) => s.stageOrder === currentStageOrder) ||
        selectedProject?.stages?.[0] ||
        null;

    const stageIndex = projectStage?.stageOrder;
    const stageTitle = projectStage?.stageName || getStage(stageIndex);
    const checklistLength = projectStage?.checklist?.length || 0;
    const required = projectStage?.checklist?.filter((item) => item.isRequired)?.length || 0;
    const completed = projectStage?.checklist?.filter((item) => item.completed)?.length || 0;
    const requiredDone =
        projectStage?.checklist?.filter((item) => item.isRequired && item.completed)?.length || 0;

    const requiredDocs = projectStage?.requiredDocs || [];
    const docsUploaded = requiredDocs.filter(
        (doc) => doc.status === "UPLOADED" || doc.status === "VERIFIED"
    ).length;

    const allDocsUploaded =
        requiredDocs.length > 0 ? requiredDocs.every((doc) => doc.status === "UPLOADED" || doc.status === "VERIFIED") : false;

    const desc = getStageDesc(stageIndex - 1);

    const allStages = Array.isArray(selectedProject?.stages)
        ? [...selectedProject.stages].sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0))
        : [];

    const steps = allStages.length
        ? allStages.map((s) => {
            const done = isStageDone(s);
            const rejected = s.workflowStatus === "REJECTED";
            const current = s.stageOrder === currentStageOrder && !done && !rejected;
            return {
                order: s.stageOrder,
                label: s.stageName || getStage(s.stageOrder),
                done,
                rejected,
                current,
                pending: !done && !rejected && !current,
                dotClass: done
                    ? "bg-primary"
                    : rejected
                        ? "bg-[#D20019]"
                        : current
                            ? "bg-surface ring-2 ring-accent"
                            : "bg-line-soft",
            };
        })
        : Object.entries(STAGES).map(([order, label]) => ({
            order: Number(order),
            label,
            done: false,
            rejected: false,
            current: Number(order) === (currentStageOrder || 1),
            pending: true,
            dotClass: "bg-line-soft",
        }));

    const doneStages = allStages.filter(isStageDone).length;
    const progressPercent =
        allStages.length > 0
            ? Math.round((doneStages / allStages.length) * 100)
            : Math.round(Number(selectedProject?.progressPercent) || 0);

    const isCompleted = projectStage?.workflowStatus === "COMPLETED";
    const isManager = user?.role === "PROJECTMANAGER";
    const isHeadOfOps = user?.role === "HEADOFOPS";

    const isRejected = projectStage?.workflowStatus === "REJECTED";
    const rejectionReason =
        selectedProject?.approvals?.find(
            (approval) => approval.stage === projectStage?.stageOrder
        )?.comment || "";

    const actionMap = {
        PROJECTMANAGER: submitStage,
        HEADOFOPS: approveStage,
    };

    const handleWorkflowAction = async () => {
        if (busy) return;

        if (allDocsUploaded === false) {
            showNotification({
                type: "error",
                title: "Project Incomplete!",
                message: "Upload all supporting documents to submit this stage"
            });
            return;
        }

        if (isCompleted) {
            showNotification({
                type: "success",
                title: "Project Completed!",
                message: isManager
                    ? `You have successfully completed - ${selectedProject?.projectName}`
                    : `This project - ${selectedProject?.projectName} has been successfully completed`
            });
            return;
        }

        const action = actionMap[user?.role];

        if (!action) {
            console.log("Unauthorized");
            return;
        }

        setBusy(true);

        try {
            const response = await action(
                selectedProject?.projectId,
                projectStage?.stageOrder
            );

            const updatedProject = response.data;

            setSelectedProject(updatedProject);
            setProjects(prevProjects =>
                (Array.isArray(prevProjects) ? prevProjects : []).map(project =>
                    project.projectId === updatedProject.projectId
                        ? updatedProject
                        : project
                )
            );

            isManager
                ? showNotification({
                    type: "success",
                    title: "Signoff Request Sent!",
                    message: `You have successfully sent a signoff request for - ${selectedProject?.projectName} (${projectStage?.stageName})`
                })
                : showNotification({
                    type: "success",
                    title: "Project Stage Signed off Successful!",
                    message: `You have successfully signed off for - ${selectedProject?.projectName} (${projectStage?.stageName})`
                });

            onClose();
            window.dispatchEvent(new Event("notifications:refresh"));
        } catch (err) {
            console.error(err);
            showNotification({
                type: "error",
                title: "Signoff Request Failed!",
                message: err.message
            });
        } finally {
            setBusy(false);
        }
    };

    const openReject = () => {
        setReason("");
        setReasonError("");
        setRejectOpen(true);
    };

    const confirmReject = async () => {
        if (!reason.trim()) {
            setReasonError("Please enter a reason for rejection.");
            return;
        }

        setRejecting(true);

        try {
            const response = await rejectStage(
                selectedProject?.projectId,
                projectStage?.stageOrder,
                reason.trim()
            );

            const updatedProject = response.data;

            setSelectedProject(updatedProject);
            setProjects(prevProjects =>
                (Array.isArray(prevProjects) ? prevProjects : []).map(project =>
                    project.projectId === updatedProject.projectId
                        ? updatedProject
                        : project
                )
            );

            setRejectOpen(false);

            showNotification({
                type: "success",
                title: "Project Stage Signoff Rejected!",
                message: `You have successfully rejected signoff for - ${selectedProject?.projectName} (${projectStage?.stageName})`
            });

            onClose();
            window.dispatchEvent(new Event("notifications:refresh"));
        } catch (err) {
            console.error(err);
            showNotification({
                type: "error",
                title: "Reject Signoff Failed!",
                message: err.message
            });
        } finally {
            setRejecting(false);
        }
    };

    if (allStages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D0D5DD] bg-surface px-6 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <FaRegClock className="h-5 w-5" />
                </span>
                <h3 className="text-[15px]/[20px] font-semibold text-ink">No lifecycle data yet</h3>
                <p className="max-w-xs text-[13px]/[18px] text-ink-soft">
                    This project does not have any lifecycle stages configured yet. Check back once the project is set up.
                </p>
            </div>
        );
    }

    const nextStage = projectStage?.stageOrder !== 8 ? getStage((projectStage?.stageOrder || 0) + 1) : null;

    return (
        <div className="relative flex flex-col gap-4 p-6">
            {/* Lifecycle progress + stepper */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                            <FaListCheck className="h-4 w-4" />
                        </span>
                        <div>
                            <h3 className="text-[14px]/[18px] font-semibold text-ink">Lifecycle Progress</h3>
                            <p className="text-[11px]/[14px] text-ink-muted">
                                {doneStages} of {allStages.length} stages signed off
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 text-[20px]/[24px] font-bold text-primary">
                        {progressPercent}%
                    </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                    <div
                        className="h-full rounded-full bg-linear-to-r from-[#08BD66] via-primary to-accent transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <StageStepper steps={steps} />
            </div>

            {/* Stage stats */}
            <div className="grid grid-cols-3 gap-2.5">
                <StatCard
                    icon={<FaRegFileLines className="h-3.5 w-3.5" />}
                    tone="bg-primary-soft text-primary"
                    value={`${docsUploaded}/${requiredDocs.length}`}
                    label="Documents"
                />
                <StatCard
                    icon={<FaListCheck className="h-3.5 w-3.5" />}
                    tone="bg-[#EFF8FF] text-accent"
                    value={`${completed}/${checklistLength}`}
                    label="Checklist"
                />
                <StatCard
                    icon={<FaRegSquareCheck className="h-3.5 w-3.5" />}
                    tone="bg-[#ECFDF3] text-[#027A48]"
                    value={`${requiredDone}/${required}`}
                    label="Mandatory"
                />
            </div>

            {/* Current stage card */}
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                <div className="bg-linear-to-br from-primary to-primary-strong px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px]/[14px] font-semibold uppercase tracking-wider text-white/60">
                            Stage {stageIndex} of {allStages.length}
                        </span>
                        <WorkflowBadge status={projectStage?.workflowStatus} />
                    </div>
                    <h3 className="mt-2 text-[18px]/[24px] font-semibold text-white">{stageTitle}</h3>
                    <p className="mt-1 text-[13px]/[18px] text-white/70">{desc}</p>
                </div>

                <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-[12px]/[16px]">
                            <span className="font-medium text-ink-soft">Stage readiness</span>
                            <span className="font-semibold text-ink">
                                {checklistLength > 0 ? Math.round((completed / checklistLength) * 100) : 0}%
                            </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    checklistLength > 0 && completed === checklistLength
                                        ? "bg-[#08BD66]"
                                        : "bg-accent"
                                }`}
                                style={{
                                    width: `${checklistLength > 0 ? Math.round((completed / checklistLength) * 100) : 0}%`
                                }}
                            />
                        </div>
                    </div>
                    {nextStage && (
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-line px-2.5 py-1">
                            <span className="text-[11px]/[14px] font-medium text-ink-muted">Next</span>
                            <FaArrowRight className="h-2.5 w-2.5 text-ink-muted" />
                            <span className="text-[11px]/[14px] font-semibold text-ink">{nextStage}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection feedback */}
            {isRejected && (
                <div className="rounded-2xl border border-[#FDA29B] bg-[#FEF3F2] p-4 shadow-card">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FEE4E2] text-[#D20019]">
                            <FaRegCircleXmark className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-[14px]/[20px] font-semibold text-[#B42318]">
                                Stage rejected — action required
                            </h4>
                            <p className="mt-1 text-[13px]/[18px] text-[#912018]">
                                {rejectionReason || "The Head of Operations rejected this stage signoff. Address the feedback and resubmit."}
                            </p>
                            {projectStage?.rejectedAt && (
                                <p className="mt-1.5 text-[12px]/[16px] text-[#B42318]/70">
                                    Rejected on {new Date(projectStage.rejectedAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Supporting documents */}
            <div>
                <SectionHeader
                    icon={<FaRegFileLines className="h-3.5 w-3.5" />}
                    title="Supporting Documents"
                    badge={`${docsUploaded}/${requiredDocs.length} uploaded`}
                />
                {requiredDocs.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#D0D5DD] bg-surface px-4 py-5 text-center text-[13px]/[18px] text-ink-muted">
                        No documents required for this stage.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {requiredDocs.map((doc) => (
                            <UploadBox
                                key={doc.key}
                                title={doc.title}
                                docKey={doc.key}
                                docStatus={doc.status}
                                docName={doc.fileName}
                                docURL={doc.fileURL}
                                projectId={selectedProject?.projectId}
                                stageId={projectStage?.id}
                                user={user}
                                setProjects={setProjects}
                                setSelectedProject={setSelectedProject}
                                showNotification={showNotification}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Stage checklist */}
            <div>
                <SectionHeader
                    icon={<FaListCheck className="h-3.5 w-3.5" />}
                    title="Stage Checklist"
                    badge={`${completed}/${checklistLength} complete`}
                />
                {checklistLength === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#D0D5DD] bg-surface px-4 py-5 text-center text-[13px]/[18px] text-ink-muted">
                        No checklist items for this stage.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {projectStage.checklist.map((item) => (
                            <div
                                key={item.id}
                                role="button"
                                tabIndex={isManager ? 0 : -1}
                                onClick={() =>
                                    isManager &&
                                    toggleChecklist(
                                        setProjects,
                                        setSelectedProject,
                                        selectedProject?.projectId,
                                        projectStage?.id,
                                        item.id,
                                        user
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (isManager && (e.key === "Enter" || e.key === " ")) {
                                        e.preventDefault();
                                        toggleChecklist(
                                            setProjects,
                                            setSelectedProject,
                                            selectedProject?.projectId,
                                            projectStage?.id,
                                            item.id,
                                            user
                                        );
                                    }
                                }}
                                className={`group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-all ${
                                    isManager
                                        ? "cursor-pointer hover:border-primary/25 hover:shadow-card"
                                        : "cursor-default"
                                }`}
                            >
                                <div className="flex min-w-0 items-start gap-3">
                                    <span
                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                            item.completed
                                                ? "border-primary bg-primary text-white"
                                                : "border-[#D0D5DD] bg-surface text-transparent group-hover:border-accent"
                                        }`}
                                    >
                                        <FaCheck className="h-2.5 w-2.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`text-[14px]/[20px] font-medium ${item.completed ? "text-ink-soft" : "text-ink"}`}>
                                            {item.title}
                                        </p>
                                        <p className="mt-0.5 text-[12px]/[16px] text-ink-muted">{item.desc}</p>
                                    </div>
                                </div>
                                {item.isRequired && (
                                    <span className="shrink-0 rounded-full bg-[#FFF4E5] px-2 py-0.5 text-[10px]/[14px] font-semibold uppercase tracking-wide text-[#B54708]">
                                        Required
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            {isManager && (
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                    <button
                        onClick={handleWorkflowAction}
                        disabled={busy || isCompleted}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px]/[20px] font-semibold transition-colors ${
                            isCompleted
                                ? "cursor-default bg-[#ECFDF3] text-[#027A48]"
                                : "bg-primary text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
                        }`}
                    >
                        {busy ? (
                            <>
                                <FaSpinner className="h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : isCompleted ? (
                            <>
                                <FaRegCircleCheck className="h-4 w-4" />
                                Stage Completed
                            </>
                        ) : (
                            <>
                                <FaRegCircleCheck className="h-4 w-4" />
                                Request Signoff
                            </>
                        )}
                    </button>
                    {!isCompleted && (
                        <p className={`mt-2.5 flex items-start gap-1.5 text-[12px]/[16px] ${
                            allDocsUploaded ? "text-ink-muted" : "text-[#B54708]"
                        }`}>
                            <FaRegCircleXmark className={`mt-0.5 h-3 w-3 shrink-0 ${allDocsUploaded ? "text-ink-muted" : "text-[#B54708]"}`} />
                            {allDocsUploaded
                                ? "Ensure every checklist item is complete before requesting signoff."
                                : "Upload all supporting documents before requesting signoff."}
                        </p>
                    )}
                </div>
            )}

            {isHeadOfOps && (
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                    {isCompleted ? (
                        <button
                            disabled
                            className="inline-flex w-full cursor-default items-center justify-center gap-2 rounded-lg bg-[#ECFDF3] px-4 py-3 text-[14px]/[20px] font-semibold text-[#027A48]"
                        >
                            <FaRegCircleCheck className="h-4 w-4" />
                            Stage Completed
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleWorkflowAction}
                                disabled={busy}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px]/[20px] font-semibold text-white transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {busy ? (
                                    <>
                                        <FaSpinner className="h-4 w-4 animate-spin" />
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <FaRegCircleCheck className="h-4 w-4" />
                                        Accept Signoff
                                    </>
                                )}
                            </button>
                            <button
                                onClick={openReject}
                                disabled={busy}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D20019] px-4 py-3 text-[14px]/[20px] font-semibold text-white transition-colors hover:bg-[#A40014] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FaRegCircleXmark className="h-4 w-4" />
                                Reject Signoff
                            </button>
                        </div>
                    )}
                </div>
            )}

            <RejectModal
                open={rejectOpen}
                busy={rejecting}
                reason={reason}
                error={reasonError}
                onReasonChange={(value) => {
                    setReason(value);
                    if (reasonError && value.trim()) setReasonError("");
                }}
                onCancel={() => !rejecting && setRejectOpen(false)}
                onConfirm={confirmReject}
            />
        </div>
    );
}

export default ProjectLifeCycle
