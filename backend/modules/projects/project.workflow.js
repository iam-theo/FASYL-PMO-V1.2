import { POLICY } from "../workflow/workflow.policy.js";
import { getStageKey } from "./project.service.js";

/* =========================
    CREATE SINGLE STAGE
========================= */
const createStage = (projectId, stageOrder) => {
  const stageKey = getStageKey(stageOrder);
  const policy = POLICY[stageKey];

  if (!policy) {
    throw new Error(`No policy found for stageKey: ${stageKey}`);
  }

  return {
    projectId,
    stageOrder,

    stageKey,
    stageName: policy.name,

    workflowStatus:
      stageOrder === 1 ? "OPEN" : "LOCKED",

    checklist: policy.checklist.map((item) => ({
      key: item.key,
      title: item.title,
      desc: item.desc,
      isRequired: item.isRequired,
      completed: false,
      completedAt: null,
    })),

    requiredDocs: policy.requiredDocs.map((item) => ({
      key: item.key,
      title: item.title,
      fileURL: item.fileURL,
      status: "PENDING",
      id: item.id,
      uploadedAt: null
    })),

    completed: false,
    completedAt: null,

    submittedAt: null,
    submittedBy: null,

    approvedAt: null,
    approvedBy: null,

    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,

    escalated: false,
    escalatedAt: null,
    escalatedBy: null,
  };
};  

/* =========================
   INIT ALL PROJECT STAGES
========================= */
export const initStages = (projectId) => {
  return Array.from({ length: 8 }, (_, index) =>
    createStage(projectId, index + 1)
  );
};