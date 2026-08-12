import { sendEmail, isEmailConfigured } from "../../utils/email.service.js";
import { prisma } from "../../prisma/prisma.client.js";
import { sendToUser } from "../realtime/realtime.service.js";

const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.PUBLIC_BASE_URL ||
  "http://localhost:5173";

const SIGN_OFF_BUTTON_URL = `${APP_BASE_URL}/app`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatDate = (value) => {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatAssigneeName = (assignee) => {
  if (assignee?.fullName) return assignee.fullName;
  if (assignee?.firstName && assignee?.lastName) {
    return `${assignee.firstName} ${assignee.lastName}`;
  }
  return "you";
};

const buildLayout = ({
  title,
  greeting,
  intro,
  detailsRows,
  buttonLabel,
  buttonUrl,
}) => `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F2F4F7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F2F4F7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #EAECF0;">
            <tr>
              <td style="background-color:#1B3C4A;padding:24px 32px;">
                <span style="color:#FFFFFF;font-size:18px;font-weight:bold;">FASYL PMO</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#101828;">
                <h1 style="margin:0 0 8px;font-size:20px;color:#1B3C4A;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 16px;color:#475467;font-size:14px;line-height:1.6;">${escapeHtml(greeting)}</p>
                <p style="margin:0 0 20px;color:#475467;font-size:14px;line-height:1.6;">${escapeHtml(intro)}</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #EAECF0;border-radius:8px;margin-bottom:24px;">
                  ${detailsRows
                    .map(
                      ([label, value]) => `
                    <tr>
                      <td style="padding:10px 16px;font-size:12px;color:#667085;width:40%;vertical-align:top;">${escapeHtml(label)}</td>
                      <td style="padding:10px 16px;font-size:14px;color:#101828;font-weight:600;">${escapeHtml(value)}</td>
                    </tr>`,
                    )
                    .join("")}
                </table>

                ${
                  buttonUrl
                    ? `<a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background-color:#1B3C4A;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">${escapeHtml(buttonLabel)}</a>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #EAECF0;color:#98A2B3;font-size:12px;">
                This is an automated message from the FASYL PMO portal.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const toPlainText = ({ title, greeting, intro, detailsRows }) =>
  [
    title,
    "",
    greeting,
    intro,
    "",
    ...detailsRows.map(([label, value]) => `${label}: ${value}`),
    "",
    "This is an automated message from the FASYL PMO portal.",
  ].join("\n");

/**
 * Resolves a User id for an assignee. Assignees can be a real User (from
 * `assignedToUser` / `projectManager`) or a project resource (from the JSON
 * `project.resources` array, which only carries an email). Email is the most
 * reliable key — resource `recordId` values do not map to User ids. Never
 * throws.
 */
const findUserIdForAssignee = async (assignee) => {
  if (!assignee) return null;

  try {
    if (assignee.email) {
      const user = await prisma.user.findUnique({
        where: { email: assignee.email },
        select: { id: true },
      });
      if (user) return user.id;
    }

    if (assignee.id != null) {
      const user = await prisma.user.findUnique({
        where: { id: Number(assignee.id) },
        select: { id: true },
      });
      if (user) return user.id;
    }
  } catch (error) {
    console.error("❌ Assignee user lookup failed:", error.message);
  }

  return null;
};

/**
 * Emails a user or resource that a task was assigned to them, and creates an
 * in-app notification when the assignee maps to a User account.
 * Never throws — failures are logged by the email service.
 */
export const notifyTaskAssignment = async ({
  task,
  assignee,
  assignedBy,
}) => {
  const email = assignee?.email;
  const assigneeName = formatAssigneeName(assignee);
  const assignerName =
    assignedBy?.fullName || assignedBy?.email || "The operations team";

  const detailsRows = [
    ["Task", task.title],
    ["Project", task.project?.projectName || task.projectId || "—"],
    ["Stage", task.stage?.stageName || "—"],
    ["Priority", task.priority || "—"],
    ["Due date", formatDate(task.dueDate)],
    ["Status", task.status || "TODO"],
  ];

  const title = "You have been assigned a task";
  const greeting = `Hi ${assigneeName},`;
  const intro = `${assignerName} assigned you a new task in the FASYL PMO portal.`;

  const projectId = task.project?.projectId || null;
  const userId = await findUserIdForAssignee(assignee);

  if (userId) {
    await createInAppNotification({
      userId,
      projectId,
      type: "TASK_ASSIGNED",
      title,
      message: `${assignerName} assigned "${task.title}" to you.`,
      data: {
        projectId,
        projectName: task.project?.projectName || null,
        taskId: task.id,
        taskTitle: task.title,
        stageName: task.stage?.stageName || null,
      },
    });
  }

  return sendEmail({
    to: email,
    subject: `[FASYL PMO] New task assigned: ${task.title}`,
    text: toPlainText({ title, greeting, intro, detailsRows }),
    html: buildLayout({
      title,
      greeting,
      intro,
      detailsRows,
      buttonLabel: "View task",
      buttonUrl: APP_BASE_URL,
    }),
  });
};

/**
 * Emails a project manager that a project was assigned to them, and creates an
 * in-app notification for them. Never throws — failures are logged by the
 * email service.
 */
export const notifyProjectAssignment = async ({
  project,
  projectManager,
  assignedBy,
}) => {
  const email = projectManager?.email;
  const assignerName =
    assignedBy?.fullName || assignedBy?.email || "The operations team";

  const detailsRows = [
    ["Project", project.projectName],
    ["Client", project.clientName || "—"],
    ["Project ID", project.projectId || "—"],
    ["Due date", formatDate(project.dueDate)],
    ["Status", project.workflowStatus || "OPEN"],
  ];

  const title = "A project has been assigned to you";
  const greeting = `Hi ${formatAssigneeName(projectManager)},`;
  const intro = `${assignerName} assigned you as the project manager for a new project in the FASYL PMO portal.`;

  const userId = await findUserIdForAssignee(projectManager);

  if (userId) {
    await createInAppNotification({
      userId,
      projectId: project.projectId || null,
      type: "PROJECT_ASSIGNED",
      title,
      message: `${assignerName} assigned you as the project manager for ${project.projectName}.`,
      data: {
        projectId: project.projectId || null,
        projectName: project.projectName,
      },
    });
  }

  return sendEmail({
    to: email,
    subject: `[FASYL PMO] New project assigned: ${project.projectName}`,
    text: toPlainText({ title, greeting, intro, detailsRows }),
    html: buildLayout({
      title,
      greeting,
      intro,
      detailsRows,
      buttonLabel: "Open project",
      buttonUrl: APP_BASE_URL,
    }),
  });
};

/**
 * Persists an in-app notification row. Never throws — notification failures
 * must not break the workflow that triggered them.
 */
export const createInAppNotification = async ({
  userId,
  projectId,
  type,
  title,
  message,
  data,
}) => {
  try {
    if (!userId) return null;

    const notif = await prisma.notification.create({
      data: {
        userId,
        projectId: projectId ?? null,
        type: type ?? "GENERAL",
        title,
        message: message ?? null,
        data: data ?? undefined,
      },
    });

    sendToUser(userId, "notification", notif);
    return notif;
  } catch (error) {
    console.error("❌ In-app notification failed:", error.message);
    return null;
  }
};

const getStageDisplayName = (stage) =>
  stage?.stageName || stage?.stageKey || `Stage ${stage?.stageOrder ?? ""}`.trim();

const getUserById = async (id) => {
  if (!id) return null;

  return prisma.user
    .findUnique({
      where: { id: Number(id) },
      select: { id: true, email: true, fullName: true },
    })
    .catch(() => null);
};

/**
 * Notifies every HEADOFOPS user — in-app + email — that a stage signoff has
 * been submitted and awaits their review. Never throws.
 */
export const notifyStageSignoffRequested = async ({
  project,
  stage,
  submittedById,
}) => {
  try {
    const heads = await prisma.user.findMany({
      where: { role: "HEADOFOPS" },
      select: { id: true, email: true, fullName: true },
    });

    if (!heads.length) return;

    const submitter = (await getUserById(submittedById)) || {};
    const submitterName = submitter.fullName || submitter.email || "A project manager";
    const stageName = getStageDisplayName(stage);
    const projectName = project.projectName;

    const detailsRows = [
      ["Project", projectName],
      ["Project ID", project.projectId || "—"],
      ["Stage", stageName],
      ["Submitted by", submitterName],
    ];

    const title = "Stage signoff awaiting your approval";
    const intro = `${submitterName} submitted the "${stageName}" stage for your review.`;

    for (const head of heads) {
      await createInAppNotification({
        userId: head.id,
        projectId: project.projectId,
        type: "STAGE_SIGNOFF_REQUEST",
        title,
        message: `${submitterName} submitted "${stageName}" for ${projectName}.`,
        data: {
          projectId: project.projectId,
          projectName,
          stageOrder: stage.stageOrder,
          stageKey: stage.stageKey,
          stageName,
        },
      });

      await sendEmail({
        to: head.email,
        subject: `[FASYL PMO] Signoff requested: ${stageName} — ${projectName}`,
        text: toPlainText({
          title,
          greeting: `Hi ${formatAssigneeName(head)},`,
          intro,
          detailsRows,
        }),
        html: buildLayout({
          title,
          greeting: `Hi ${formatAssigneeName(head)},`,
          intro,
          detailsRows,
          buttonLabel: "Open project",
          buttonUrl: SIGN_OFF_BUTTON_URL,
        }),
      });
    }
  } catch (error) {
    console.error("❌ Signoff request notification failed:", error.message);
  }
};

/**
 * Notifies the PM who submitted the stage signoff — in-app + email — that a
 * HEADOFOPS user approved or rejected it. Never throws.
 */
export const notifyStageSignoffReviewed = async ({
  project,
  stage,
  decision,
  decidedById,
  reason,
  submittedById,
}) => {
  try {
    const approved = decision === "approved";

    let recipient = await getUserById(submittedById);

    if (!recipient && project.projectManagerId) {
      recipient = await getUserById(project.projectManagerId);
    }

    if (!recipient?.email) return;

    const decider = (await getUserById(decidedById)) || {};
    const deciderName = decider.fullName || decider.email || "The Head of Operations";
    const stageName = getStageDisplayName(stage);
    const projectName = project.projectName;

    const detailsRows = [
      ["Project", projectName],
      ["Project ID", project.projectId || "—"],
      ["Stage", stageName],
      [approved ? "Approved by" : "Rejected by", deciderName],
      ...(reason ? [["Reason", reason]] : []),
    ];

    const title = approved
      ? "Stage signoff approved"
      : "Stage signoff rejected";
    const intro = approved
      ? `Your signoff for "${stageName}" was approved by ${deciderName}.`
      : `Your signoff for "${stageName}" was rejected by ${deciderName}.`;

    await createInAppNotification({
      userId: recipient.id,
      projectId: project.projectId,
      type: approved ? "STAGE_SIGNOFF_APPROVED" : "STAGE_SIGNOFF_REJECTED",
      title,
      message: approved
        ? `"${stageName}" was approved for ${projectName}.`
        : `"${stageName}" was rejected for ${projectName}.${
            reason ? ` Reason: ${reason}` : ""
          }`,
      data: {
        projectId: project.projectId,
        projectName,
        stageOrder: stage.stageOrder,
        stageKey: stage.stageKey,
        stageName,
        reason: reason ?? null,
      },
    });

    await sendEmail({
      to: recipient.email,
      subject: `[FASYL PMO] Signoff ${approved ? "approved" : "rejected"}: ${stageName} — ${projectName}`,
      text: toPlainText({
        title,
        greeting: `Hi ${formatAssigneeName(recipient)},`,
        intro,
        detailsRows,
      }),
      html: buildLayout({
        title,
        greeting: `Hi ${formatAssigneeName(recipient)},`,
        intro,
        detailsRows,
        buttonLabel: "Open project",
        buttonUrl: SIGN_OFF_BUTTON_URL,
      }),
    });
  } catch (error) {
    console.error("❌ Signoff review notification failed:", error.message);
  }
};

/**
 * Emails a project manager that they have been unassigned from a project
 * (e.g. reassigned to someone else), and creates an in-app notification for
 * them. Never throws.
 */
export const notifyProjectUnassigned = async ({
  project,
  projectManager,
  unassignedBy,
}) => {
  try {
    if (!projectManager?.email) return;

    const unassignerName =
      unassignedBy?.fullName || unassignedBy?.email || "The operations team";

    const detailsRows = [
      ["Project", project.projectName],
      ["Client", project.clientName || "—"],
      ["Project ID", project.projectId || "—"],
    ];

    const title = "You have been unassigned from a project";
    const greeting = `Hi ${formatAssigneeName(projectManager)},`;
    const intro = `${unassignerName} removed you as the project manager for ${project.projectName} in the FASYL PMO portal.`;

    const userId = await findUserIdForAssignee(projectManager);

    if (userId) {
      await createInAppNotification({
        userId,
        projectId: project.projectId || null,
        type: "PROJECT_UNASSIGNED",
        title,
        message: `${unassignerName} unassigned you from ${project.projectName}.`,
        data: {
          projectId: project.projectId || null,
          projectName: project.projectName,
        },
      });
    }

    await sendEmail({
      to: projectManager.email,
      subject: `[FASYL PMO] You have been unassigned: ${project.projectName}`,
      text: toPlainText({ title, greeting, intro, detailsRows }),
      html: buildLayout({
        title,
        greeting,
        intro,
        detailsRows,
        buttonLabel: "Open portal",
        buttonUrl: APP_BASE_URL,
      }),
    });
  } catch (error) {
    console.error("❌ Project unassignment notification failed:", error.message);
  }
};

/**
 * Emails a staff member that they were added as a resource to a project, and
 * creates an in-app notification when the resource maps to a User account.
 * Never throws.
 */
export const notifyResourceAssigned = async ({
  project,
  resource,
  assignedBy,
}) => {
  try {
    if (!resource?.email) return;

    const assignerName =
      assignedBy?.fullName || assignedBy?.email || "The project manager";

    const detailsRows = [
      ["Project", project.projectName],
      ["Client", project.clientName || "—"],
      ["Project ID", project.projectId || "—"],
      ["Designation", resource.designation || "—"],
    ];

    const title = "You have been added to a project";
    const greeting = `Hi ${formatAssigneeName(resource)},`;
    const intro = `${assignerName} added you as a resource on ${project.projectName} in the FASYL PMO portal.`;

    const userId = await findUserIdForAssignee(resource);

    if (userId) {
      await createInAppNotification({
        userId,
        projectId: project.projectId || null,
        type: "RESOURCE_ASSIGNED",
        title,
        message: `${assignerName} added you as a resource on ${project.projectName}.`,
        data: {
          projectId: project.projectId || null,
          projectName: project.projectName,
        },
      });
    }

    await sendEmail({
      to: resource.email,
      subject: `[FASYL PMO] You have been added to a project: ${project.projectName}`,
      text: toPlainText({ title, greeting, intro, detailsRows }),
      html: buildLayout({
        title,
        greeting,
        intro,
        detailsRows,
        buttonLabel: "Open project",
        buttonUrl: APP_BASE_URL,
      }),
    });
  } catch (error) {
    console.error("❌ Resource assignment notification failed:", error.message);
  }
};

export { isEmailConfigured };
