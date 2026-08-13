import { PrismaClient, WorkflowStatus } from "@prisma/client";
import { getPolicy } from "../../modules/workflow/workflow.policy.js";
import { createUserAccountService } from "../auth/auth.service.js";
const prisma = new PrismaClient();
// import axios from "axios";

import fs from "fs";
import path from "path";

const TOTAL_STAGES = 8;
/* =========================================
    PROGRESS CALCULATION
========================================= */
// const calcProgress = (stage) => {
//   return (stage / TOTAL_STAGES) * 100;
// };

const createChecklist = (items, stageKey) => {
  return items.map((item, index) => ({
    id: item.id || `${stageKey}-c${index + 1}`,
    key: item.key,
    title: item.title,
    desc: item.desc,
    isRequired: item.isRequired ?? false,
    requiredDoc: item.requiredDoc || null,
    completed: false,
    completedAt: null,
  }));
};

const createRequiredDocs = (docs, stageKey) => {
  return docs.map((doc, index) => ({
    id:`${stageKey}-c${index + 1}`,
    key: typeof  doc === "string" ? doc : doc.key,
    title: typeof doc === "string"
        ? doc
        : doc.title || doc.key,
    fileURL: null,
    fileName: null,
    uploadedAt: null,
    status: "PENDING"
  }));
};

/* =========================================
    CHECKLIST ↔ DOC LINK REPAIR
========================================= */
// Stages created by older code paths may lack the `requiredDoc` link on
// checklist items. Backfill it from the stage policy so that a validated
// upload can drive the checklist (and the completed card) again.
const syncChecklistRequiredDoc = (stageKey, checklist) => {
  if (!stageKey || !Array.isArray(checklist)) return checklist;

  let policyItems = [];

  try {
    policyItems = getPolicy(stageKey)?.checklist || [];
  } catch {
    policyItems = [];
  }

  return checklist.map(item => {
    if (item?.requiredDoc) return item;

    const match = policyItems.find(p => p.key === item?.key);

    if (!match?.requiredDoc) return item;

    return { ...item, requiredDoc: match.requiredDoc };
  });
};

/* =========================================
    REQUIRED DOCS ↔ POLICY SYNC
========================================= */
// Stages created before a policy change may be missing a required doc (e.g.
// Stage 3's commercial terms sheet). Merge any docs the policy now declares
// into the stage so the upload box appears and its checklist items can be
// completed. Idempotent: only appends keys that are not already present.
const syncRequiredDocs = (stageKey, docs) => {
  if (!stageKey || !Array.isArray(docs)) return docs;

  let policyDocs;

  try {
    policyDocs = getPolicy(stageKey)?.requiredDocs || [];
  } catch {
    policyDocs = [];
  }

  const existing = new Set(docs.map(d => d?.key).filter(Boolean));
  const missing = policyDocs.filter(p => !existing.has(p.key));

  if (!missing.length) return docs;

  const added = missing.map((p, i) => ({
    id: `${stageKey}-c${docs.length + i + 1}`,
    key: p.key,
    title: p.title || p.key,
    fileURL: null,
    fileName: null,
    uploadedAt: null,
    status: "PENDING"
  }));

  return [...docs, ...added];
};

// Persists the policy-merged docs on the stage, no-op when nothing changed.
const persistStageRequiredDocs = async (stage) => {
  if (!stage?.stageKey || !Array.isArray(stage.requiredDocs)) return stage;

  const syncedDocs = syncRequiredDocs(
    stage.stageKey,
    stage.requiredDocs
  );

  if (syncedDocs.length === stage.requiredDocs.length) return stage;

  return prisma.projectStage.update({
    where: { id: stage.id },
    data: { requiredDocs: syncedDocs },
  });
};

export const getStageKey = (order) => {
  const map = {
    1: "client_identification",
    2: "client_engagement",
    3: "project_initiation",
    4: "project_planning",
    5: "project_execution",
    6: "project_uat",
    7: "go_live",
    8: "project_closure"
  };

  return map[order];
};

export const buildWorkflowForProject = async (projectId) => {
  // PREVENT DUPLICATION
  const existingCount = await prisma.projectStage.count({
    where: { projectId },
  });

  if (existingCount > 0) {
    return {
      message: "Workflow already exists",
      skipped: true,
    };
  }

  // =========================
  // BUILD STAGES
  // =========================
  const stagesData = Array.from({ length: TOTAL_STAGES }, (_, index) => {
    const stageOrder = index + 1;
    const stageKey = getStageKey(stageOrder);
    const policy = getPolicy(stageKey);

    return {
      projectId,

      stageIndex: stageOrder,
      stageOrder,

      stageKey: policy.key,
      stageName: policy.name,

      workflowStatus: stageOrder === 1 ? "OPEN" : "LOCKED",

      checklist: JSON.parse(JSON.stringify(
        createChecklist(policy.checklist, stageKey)
      )),

      requiredDocs: JSON.parse(JSON.stringify(
        createRequiredDocs(policy.requiredDocs || [], stageKey)
      )),
    };
  });

  await prisma.projectStage.createMany({
    data: stagesData,
  });

  // =========================
  // CREATE APPROVALS
  // =========================
  const approvals = stagesData.map((stage) => ({
    projectId,
    stage: stage.stageOrder,
    status: "PENDING",
  }));

  await prisma.projectApproval.createMany({
    data: approvals,
  });

  return {
    success: true,
    message: "Workflow created",
  };
};

// export const createProjectService = async (data, user) => {
//   const dbUser = await prisma.user.findUnique({
//     where: { id: user.id },
//   });

//   if (!dbUser) {
//     throw new Error("Invalid PMO user");
//   }

//   let projectManagerId = null;

//   if (data.projectManagerEmail) {
//     const pm = await prisma.user.findUnique({
//       where: { email: data.projectManagerEmail },
//     });

//     if (!pm) {
//       throw new Error("Project Manager not found");
//     }

//     projectManagerId = pm.id;
//   }

//   // =========================
//   // CREATE PROJECT
//   // =========================
//   const project = await prisma.project.create({
//     data: {
//       projectName: data.name,
//       clientName: data.clientName,
//       productName: data.productName,

//       projectManagerId,

//       workflowStatus: "OPEN",
//       currentStageOrder: 1,
//     },
//   });

//   // =========================
//   //  BUILD WORKFLOW (ONE SYSTEM FOR ALL)
//   // =========================
//   await buildWorkflowForProject(project.id);

//   return prisma.project.findUnique({
//     where: { id: project.id },
//     include: {
//       stages: true,
//       approvals: true,
//       projectManager: true,
//     },
//   });
// };

export const assignProjectService = async (projectId, pmEmail) => {

  const user = await prisma.user.findUnique({
    where: { email: pmEmail }
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "PROJECTMANAGER") {
    throw new Error("User is not a Project Manager");
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectManager: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Project not found");
  }

  // Keep the previous manager so the caller can notify them that they have
  // been unassigned when the project is handed over to someone else.
  const previousManager =
    existing.projectManager?.email &&
    existing.projectManager.email.toLowerCase() !== String(pmEmail).toLowerCase()
      ? existing.projectManager
      : null;

  // Only bootstrap the workflow for brand-new (never-assigned) projects.
  // Reassignments keep the current stage so the project resumes exactly
  // where it left off instead of restarting at stage 1.
  const isNewWorkflow =
    existing.workflowStatus === WorkflowStatus.UNASSIGNED ||
    existing.currentStageOrder === 0;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      projectManagerId: user.id,
      ...(isNewWorkflow
        ? {
            currentStageOrder: 1,
            workflowStatus: WorkflowStatus.OPEN,
          }
        : {}),
    },
  });

  if (isNewWorkflow) {
    await prisma.projectStage.updateMany({
      where: {
        projectId: project.projectId,
        stageOrder: 1,
      },
      data: {
        workflowStatus: WorkflowStatus.OPEN,
      },
    });

    await prisma.projectStage.updateMany({
      where: {
        projectId: project.projectId,
        stageOrder: { gt: 1 },
      },
      data: {
        workflowStatus: WorkflowStatus.LOCKED,
      },
    });
  }

  return await prisma.project.findUnique({
    where: {
      projectId: project.projectId
    },

    include: {
      projectManager: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },

      stages: {
        orderBy: {
          stageOrder: "asc",
        },
      },

      approvals: true,
    },
  }).then((project) => ({ project, previousManager }));
};

/* =========================================
    GET PROJECT
========================================= */
export const getProjectsService = async (user) => {
  const where = {};

  // ROLE-BASED FILTERING
  if (user.role === "PROJECTMANAGER") {
    // Filter by the scalar relation key, not the relation itself — the
    // generated client rejects `projectManager: "email"`.
    where.projectManagerId = user.id;
  }

  let projects = await prisma.project.findMany({
    where,
    include: {
      projectManager: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      stages: {
        // Intentionally slim: the list view only needs the stage scalars
        // (id, stageOrder, workflowStatus, ...). Tasks, reminders and reports
        // are fetched on demand for the stage you open; including them here
        // bloats the payload with the full project tree on every page load.
        orderBy: {
          stageOrder: "asc"
        }
      },
      approvals: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // STAFF users are project resources, and resources live in a Json column,
  // so the containment check runs after the query.
  if (user.role === "STAFF") {
    const email = (user.email || "").toLowerCase();

    projects = projects.filter((project) =>
      (Array.isArray(project.resources) ? project.resources : []).some(
        (resource) =>
          (resource.email || "").toLowerCase() === email,
      ),
    );
  }

  // Lazy-migrate stage required docs against the current policy so stages
  // created before a policy change still show every required upload box.
  projects = await Promise.all(projects.map(async (project) => {
    const stages = await Promise.all(
      (Array.isArray(project.stages) ? project.stages : []).map(
        (stage) => persistStageRequiredDocs(stage)
      )
    );

    return { ...project, stages };
  }));

  return projects;
};

export const getProjectByIdService = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { projectId: projectId },
    include: {
      projectManager: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      stages: {
        orderBy: { stageOrder: "asc" }
      },
      approvals: {
        orderBy: { stage: "asc" }
      }
    }
  });

  if (project) {
    project.stages = await Promise.all(
      (Array.isArray(project.stages) ? project.stages : []).map(
        (stage) => persistStageRequiredDocs(stage)
      )
    );
  }

  return project;
};


/* =========================================
    UPDATE CHECKLIST
========================================= */
export const updateChecklistBulkService = async (
  projectId,
  stageId,
  checklist
) => {

  const stage = await prisma.projectStage.findFirst({
    where: {
      id: Number(stageId),
      projectId: projectId
    },
  });

  if (!stage) throw new Error("Stage not found");

  const checklistWithDocs = syncChecklistRequiredDoc(
    stage.stageKey,
    stage.checklist
  );

  const requiredDocs = syncRequiredDocs(
    stage.stageKey,
    Array.isArray(stage.requiredDocs) ? stage.requiredDocs : []
  );

  const updatedChecklist = checklistWithDocs.map(existingItem => {
    const incomingItem = checklist.find(i => i.id === existingItem.id);

    if (!incomingItem) return existingItem

    // Items linked to a required document are completed by the upload,
    // never by a manual toggle.
    if (existingItem.requiredDoc) {
      return existingItem;
    }

    return {
      ...existingItem,
      completed: incomingItem.completed,
      completedAt: incomingItem.completed ? new Date() : null,
    };
  });

  const allRequiredDone = requiredDocs.every(d => d.status === "UPLOADED");

  const updatedStage = await prisma.projectStage.update({
    where: { id: Number(stageId) },
    data: {
      requiredDocs: requiredDocs,
      checklist: updatedChecklist,
      completed: updatedChecklist.every(i => i.completed && allRequiredDone),
    },
  });

  return updatedStage;
};


/* =========================================
    UPLOAD DOCS
========================================= */

export const uploadStageDocumentService = async (
  projectId,
  stageId,
  docKey,
  fileUrl,
  fileName
) => {

  const stage = await prisma.projectStage.findFirst({
    where: {
      id: Number(stageId),
      projectId: projectId
    },
  });

  if (!stage) throw new Error("Stage not found");

  const checklist = syncChecklistRequiredDoc(
    stage.stageKey,
    stage.checklist
  );

  const docs = syncRequiredDocs(
    stage.stageKey,
    Array.isArray(stage.requiredDocs) ? stage.requiredDocs : []
  );

  const updatedDocs = docs.map(doc => {

    if (doc.key !== docKey) return doc;

    return {
      ...doc,
      fileURL: fileUrl,
      fileName: fileName,
      uploadedAt: new Date(),
      status: "UPLOADED",
    };
  });

  const updatedChecklist = checklist.map(item => {

    if (!item.requiredDoc) {
      return item;
    }

    const matchingDoc = updatedDocs.find(
      doc => doc.key === item.requiredDoc
    );

    return {
      ...item,
      completed: matchingDoc?.status === "UPLOADED",
      completedAt:
        matchingDoc?.status === "UPLOADED"
          ? new Date()
          : null,
    };
  });

  const allChecklistCompleted =
    updatedChecklist
      .filter(item => item.isRequired)
      .every(item => item.completed);

  return prisma.projectStage.update({
    where: {
      id: Number(stageId),
    },
    data: {
      requiredDocs: updatedDocs,
      checklist: updatedChecklist,
      completed: allChecklistCompleted,
      completedAt: allChecklistCompleted ? new Date() : null,
    },
  });

  // return prisma.project.findUnique({
  //   where: { id: Number(projectId) },
  //   include: {
  //     stages: true,
  //     approvals: true,
  //     projectManager: true,
  //   },
  // });
};

/* =========================================
    DELETE DOC
========================================= */

export const deleteStageDocumentService = async (
  projectId,
  stageId,
  docKey
) => {

  const stage = await prisma.projectStage.findFirst({
    where: {
      id: Number(stageId),
      projectId: projectId,
    },
  });

  if (!stage) {
    throw new Error("Stage not found");
  }

  const docs = syncRequiredDocs(
    stage.stageKey,
    Array.isArray(stage.requiredDocs) ? stage.requiredDocs : []
  );

  const targetDoc = docs.find(
    doc => doc.key === docKey
  );

  if (!targetDoc) {
    throw new Error("Document not found");
  }

  // DELETE FILE FROM DISK
  if (targetDoc?.fileURL) {

    const filename = path.basename(
      targetDoc.fileURL
    );

    const filepath = path.join(
      process.cwd(),
      "backend",
      "uploads",
      filename
    );

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  // RESET DOCUMENT
  const updatedDocs = docs.map(doc => {

    if (doc.key !== docKey) {
      return doc;
    }

    return {
      ...doc,
      fileURL: null,
      fileName: null,
      uploadedAt: null,
      status: "PENDING",
    };
  });

  // UNCHECK RELATED CHECKLIST
  const updatedChecklist = syncChecklistRequiredDoc(
    stage.stageKey,
    stage.checklist
  ).map(item => {

    if (item.requiredDoc !== docKey) {
      return item;
    }

    return {
      ...item,
      completed: false,
      completedAt: null,
    };
  });

  const allChecklistCompleted =
    updatedChecklist
      .filter(item => item.isRequired)
      .every(item => item.completed);

  return prisma.projectStage.update({
    where: {
      id: Number(stageId),
    },
    data: {
      requiredDocs: updatedDocs,
      checklist: updatedChecklist,
      completed: allChecklistCompleted,
      completedAt: allChecklistCompleted
        ? stage.completedAt
        : null,
    },
  });

  // return prisma.project.findUnique({
  //   where: { id: Number(projectId) },
  //   include: {
  //     stages: true,
  //     approvals: true,
  //     projectManager: true,
  //   },
  // });
};

/* =========================================
    UPDATE PROJECT
========================================= */
export const updateProjectService = async (projectId, data) => {
  return await prisma.project.update({
    where: {projectId: projectId },
    data: {
      ...(data.name !== undefined && { projectName: data.name }),
      ...(data.clientName !== undefined && { clientName: data.clientName }),
      ...(data.industry !== undefined && { industry: data.industry }),
      ...(data.productName !== undefined && { productName: data.productName }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.projectManagerEmail !== undefined && {
        projectManagerEmail: data.projectManagerEmail,
      }),
    },
  });
};

/* =========================================
    DELETE PROJECT
========================================= */
export const deleteProjectService = async (projectId) => {
  return await prisma.project.delete({
    where: { projectId: projectId },
  });
};

/* =========================================
    ADD RESOURCE TO PROJECT
========================================= */
export const addResourceToProjectService = async (projectId, data, user) => {
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
  });

  if (!project) throw new Error("Project not found");

  // Resource management is exclusive to the assigned project manager.
  if (user?.role === "PROJECTMANAGER" && project.projectManagerId !== user.id) {
    throw new Error(
      "Only the assigned project manager can manage resources on this project"
    );
  }

  const resources = Array.isArray(project.resources) ? project.resources : [];

  const email = String(data.email || "").trim().toLowerCase();
  const staffId = String(data.staffId || "").trim();
  const recordId = String(data.recordId || `MAN-${Date.now()}`).trim();
  const password = String(data.password || "").trim();

  const resource = {
    recordId,
    firstName: String(data.firstName || "").trim(),
    lastName: String(data.lastName || "").trim(),
    email,
    phoneNumber: String(data.phoneNumber || "").trim(),
    staffId,
    designation: String(data.designation || "").trim(),
    // Resources added through the modal are staff by default; an explicit
    // role (e.g. from a sales-sync payload) still wins.
    role: String(data.role || "STAFF").trim(),
  };

  if (!resource.firstName || !resource.lastName) {
    throw new Error("First name and last name are required");
  }

  const duplicate = resources.some(
    (r) =>
      (r.email && r.email.toLowerCase() === email) ||
      (r.staffId && r.staffId === staffId) ||
      (r.recordId && r.recordId === recordId)
  );

  if (email && duplicate) {
    throw new Error(
      "A resource with this email or staff ID already exists on this project"
    );
  }

  // Dual-purpose flow: when a temporary password is supplied and the staff
  // member has no account yet, create their STAFF account on the fly (flagged
  // for a mandatory first-login password change) before assigning them. The
  // password is never persisted on the project resource record.
  let accountCreated = false;

  if (password) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error(
        "An account already exists for this email — add the resource without a password"
      );
    }

    const fullName = `${resource.firstName} ${resource.lastName}`.trim();

    const created = await createUserAccountService({
      fullName,
      email,
      password,
      role: "STAFF",
    });

    if (!created?.id) {
      throw new Error("Failed to create account for this staff member");
    }

    accountCreated = true;
  }

  resources.push(resource);

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: { resources },
  });

  return { project: updatedProject, resource, accountCreated };
};

/* =========================================
    REMOVE RESOURCE FROM PROJECT
========================================= */
export const removeResourceFromProjectService = async (projectId, recordId, user) => {
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
  });

  if (!project) throw new Error("Project not found");

  // Resource management is exclusive to the assigned project manager.
  if (user?.role === "PROJECTMANAGER" && project.projectManagerId !== user.id) {
    throw new Error(
      "Only the assigned project manager can manage resources on this project"
    );
  }

  const resources = Array.isArray(project.resources) ? project.resources : [];

  const target = resources.find((r) => r.recordId === recordId);

  if (!target) {
    throw new Error("Resource not found on this project");
  }

  const remaining = resources.filter((r) => r.recordId !== recordId);

  return await prisma.project.update({
    where: { id: project.id },
    data: { resources: remaining },
  });
};