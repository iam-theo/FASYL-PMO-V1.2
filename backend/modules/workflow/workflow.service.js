import {  WorkflowStatus } from "@prisma/client";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import {
  notifyStageSignoffRequested,
  notifyStageSignoffReviewed,
} from "../notifications/notification.service.js";

/**
 * =========================
 * GET PROJECT (SAFE)
 * =========================
 */
const getProjectOrThrow = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { projectId: projectId },
    include: {
      stages: true,
      approvals: true,
    },
  });

  if (!project) throw new Error("Project not found");
  return project;
};

/**
 * =========================
 * GET STAGE STATE
 * =========================
 */
export const getStageState = async (projectId, stageOrder) => {
  const order = Number(stageOrder);

  const [project, stage, approval] = await Promise.all([
    prisma.project.findUnique({
      where: { projectId: projectId },
      include: {
        stages: true,
        approvals: true,
      }
    }),

    prisma.projectStage.findUnique({
      where: {
        projectId_stageOrder: {
          projectId: projectId,
          stageOrder: order,
        },
      },
    }),

    prisma.projectApproval.findFirst({
      where: {
        projectId: projectId,
        stage: order,
      },
    }),
  ]);

  if (!project) throw new Error("Project not found");

  if (!stage) throw new Error("Stage not found")

  return {
    project,
    stageData: stage,
    stageApproval: approval || null,
    isActiveStage: project.currentStageOrder === order,
    canSubmit: project.currentStageOrder === order,
  };
};


/**
 * =========================
 * SUBMIT STAGE
 * =========================
 */
export const submitStage = async ({
  projectId,
  stageOrder,
  userId,
}) => {

  const order = Number(stageOrder);
  const uid = Number(userId);

  const project = await getProjectOrThrow(projectId);

  // const head = await prisma.user.findFirst({
  //   where: {
  //     role: "HEADOFOPS"
  //   }
  // });

  if (!project) {
    throw new Error("Project not found");
  }

  const stage = await prisma.projectStage.findFirst({
    where: {
      projectId: projectId,
      stageOrder: order,
    },
  });

  if (!stage) {
    throw new Error("Stage not found");
  }

  if (project.currentStageOrder !== order) {
    throw new Error("Invalid stage sequence");
  }

  const approval = await prisma.projectApproval.findFirst({
    where: {
      projectId: projectId,
      stage: order,
      status: {
        in: ["PENDING", "REJECTED"]
      }, 
    },
  });

  if (!approval) {
    throw new Error("Approval record not found");
  }


  await prisma.projectStage.update({
    where: {
      id: stage.id,
    },
    data: {
      workflowStatus: WorkflowStatus.SUBMITTED,
      submittedAt: new Date(),
      submittedBy: uid, 
    },
  });

  await prisma.projectStage.updateMany({
    where: {
      stageOrder: order + 1,
    },
    data: {
      workflowStatus: WorkflowStatus.OPEN,
    },
  });


  await prisma.projectApproval.update({
    where: {
      id: approval.id,
    },
    data: {
      status: WorkflowStatus.SUBMITTED, 
      submittedBy: uid, 
      updatedAt: new Date(),
    },
  });


  await prisma.project.update({
    where: {
      projectId: projectId,
    },
    data: {
      workflowStatus: WorkflowStatus.SUBMITTED,
    },
  });

  await notifyStageSignoffRequested({
    project,
    stage,
    submittedById: uid,
  });

  return await prisma.project.findUnique({
    where: { projectId: projectId },

    include: {
        stages: {
            orderBy: {
                stageOrder: "asc"
            }
        },

        approvals: {
            orderBy: {
                stage: "asc"
            }
        },

        projectManager: true,
    },
  });
};

/**
 * =========================
 * APPROVE STAGE
 * =========================
 */
export const approveStage = async ({ projectId, stageOrder, userId }) => {

  const order = Number(stageOrder);
  const uid = Number(userId)

  const project = await getProjectOrThrow(projectId);

  if (!project) throw new Error("Project not found");

  const stage = await prisma.projectStage.findFirst({
    where: {
      projectId: projectId,
      stageOrder: order,
    },
  });

  if (!stage) throw new Error("Stage not found");

  const isFinalStage = order === 8; 

  const approval = await prisma.projectApproval.findFirst({
    where: {
      projectId: projectId,
      stage: order,
      status: WorkflowStatus.SUBMITTED, 
    },
  });

  if (!approval) {
    throw new Error("No pending approval found for this stage");
  }

  await prisma.projectApproval.update({
    where: { id: approval.id },
    data: {
      status: WorkflowStatus.APPROVED,
      approvedBy: uid, 
      updatedAt: new Date()
    }
  });


  if(!isFinalStage) { 
    const nextStage = order + 1;
    await prisma.projectStage.update({
      where: { id: stage.id },
      data: {
        workflowStatus: WorkflowStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: uid 
      }
    });

    await prisma.project.update({
      where: { projectId: projectId },
      data: {
        currentStageOrder: nextStage,
        workflowStatus: WorkflowStatus.APPROVED,
        progressPercent: Math.round((nextStage / 8) * 100)
      }
    });

  } else {
      await prisma.projectStage.update({
      where: { id: stage.id },
      data: {
        workflowStatus: WorkflowStatus.COMPLETED,
        completedAt: new Date(),
        completed: true 
      }
    });

    await prisma.project.update({
      where: { projectId: projectId },
      data: {
        currentStageOrder: order,
        workflowStatus: WorkflowStatus.COMPLETED,
        progressPercent: Math.round((order / 8) * 100)
      }
    });
  }

  await notifyStageSignoffReviewed({
    project,
    stage,
    decision: "approved",
    decidedById: uid,
    submittedById: approval.submittedBy,
  });

  return await prisma.project.findUnique({
    where: { projectId: projectId },

    include: {
        stages: {
            orderBy: {
                stageOrder: "asc"
            }
        },

        approvals: {
            orderBy: {
                stage: "asc"
            }
        },

        projectManager: true,
    },
  });
};

/**
 * =========================
 * REJECT STAGE
 * =========================
 */
export const rejectStage = async ({ projectId, stageOrder, userId, reason }) => {

  const order = Number(stageOrder);
  const uid = Number(userId)

  const project = await getProjectOrThrow(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const stage = await prisma.projectStage.findFirst({
    where: {
      projectId: projectId,
      stageOrder: order,
    },
  });

  if (!stage) {
    throw new Error("Stage not found");
  }

  const approval = await prisma.projectApproval.findFirst({
    where: {
      projectId: projectId,
      stage: order,
      status: WorkflowStatus.SUBMITTED 
    }
  });

  if (!approval) {
    throw new Error("No pending approval found for this stage");
  }

  await prisma.projectApproval.update({
    where: { id: approval.id },
    data: {
      status: WorkflowStatus.REJECTED,
      rejectedBy: uid, 
      comment: reason,
      updatedAt: new Date()
    }
  });

  await prisma.projectStage.update({
    where: { id: stage.id },
    data: {
      workflowStatus: WorkflowStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedBy: uid, 
    },
  });

  await prisma.project.update({
    where: {
      projectId: projectId,
    },
    data: {
      workflowStatus: WorkflowStatus.REJECTED,
    },
  });

  await notifyStageSignoffReviewed({
    project,
    stage,
    decision: "rejected",
    decidedById: uid,
    reason,
    submittedById: approval.submittedBy,
  });

  return await prisma.project.findUnique({
    where: { projectId: projectId },

    include: {
        stages: {
            orderBy: {
                stageOrder: "asc"
            }
        },

        approvals: {
            orderBy: {
                stage: "asc"
            }
        },

        projectManager: true,
    },
  });
};

/**
 * =========================
 * DEFAULT EXPORT (OPTIONAL)
 * =========================
 */
export default {
  submitStage,
  approveStage,
  rejectStage,
  getStageState
};