import {
  getProjectsService,
  getProjectByIdService,
  assignProjectService,
  updateProjectService,
  deleteProjectService,
  updateChecklistBulkService,
  uploadStageDocumentService,
  deleteStageDocumentService,
  addResourceToProjectService,
} from "./project.service.js";
import { notifyProjectAssignment } from "../notifications/notification.service.js";

/* =========================================
    CREATE PROJECT
========================================= */
// export const createProject = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized user",
//       });
//     }

//     const project = await createProjectService(req.body, req.user);

//     return res.status(201).json({
//       success: true,
//       message: "Project created successfully",
//       data: project,
//     });

//   } catch (err) {
//     console.error("CREATE PROJECT ERROR:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create project",
//       error: err.message,
//     });
//   }
// };

/* =========================================
    GET ALL PROJECTS (ROLE-AWARE)
========================================= */
export const getProjects = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const projects = await getProjectsService(req.user);

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: err.message,
    });
  }
};

export const assignProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { projectManagerEmail } = req.body;

    if (!projectManagerEmail) {
      return res.status(400).json({
        success: false,
        message: "projectManagerEmail is required",
      });
    }

    const project = await assignProjectService(
      Number(projectId),
      projectManagerEmail,
    );

    if (project?.projectManager?.email) {
      notifyProjectAssignment({
        project,
        projectManager: project.projectManager,
        assignedBy: req.user,
      }).catch((error) => {
        console.error("Project assignment notification failed:", error.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project assigned successfully",
      data: project,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to assign project",
      error: err.message,
    });
  }
};

/* =========================================
    ADD RESOURCE TO PROJECT
========================================= */
export const addProjectResource = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await addResourceToProjectService(projectId, req.body);

    return res.status(200).json({
      success: true,
      message: "Resource added successfully",
      data: project,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to add resource",
      error: err.message,
    });
  }
};

/* =========================================
    GET SINGLE PROJECT
========================================= */
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await getProjectByIdService(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (err) {
    console.error("GET PROJECT BY ID ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: err.message,
    });
  }
};

/* =========================================
    UPDATE CHECKLIST
========================================= */

export const updateChecklistBulk = async (req, res) => {
  try {
    const { projectId, stageId } = req.params;
    const { checklist } = req.body;

    const result = await updateChecklistBulkService(
      projectId,
      stageId,
      checklist,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("UPDATE CHECKLIST ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
    UPLOAD DOCS
========================================= */

export const uploadStageDocument = async (req, res) => {
  try {
    const { projectId, stageId, docKey } = req.params;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
    const fileUrl = `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/uploads/${file.filename}`;

    const filename = `${file.originalname}`;

    const updatedStage = await uploadStageDocumentService(
      projectId,
      stageId,
      docKey,
      fileUrl,
      filename,
    );

    return res.json({
      success: true,
      message: "Document uploaded successfully",
      data: updatedStage,
    });
  } catch (err) {
    console.error("UPLOAD DOCUMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* =========================================
    DELETE DOCS
========================================= */

export const deleteStageDocument = async (req, res) => {
  try {
    const { projectId, stageId, docKey } = req.params;

    const updatedStage = await deleteStageDocumentService(
      projectId,
      stageId,
      docKey,
    );

    return res.json({
      success: true,
      message: "Document deleted successfully",
      data: updatedStage,
    });
  } catch (err) {
    console.error("DELETE DOCUMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
    UPDATE PROJECT
========================================= */
export const updateProject = async (req, res) => {
  try {
    const updated = await updateProjectService(req.params.projectId, req.body);

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("UPDATE PROJECT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: err.message,
    });
  }
};

/* =========================================
    DELETE PROJECT
========================================= */
export const deleteProject = async (req, res) => {
  try {
    await deleteProjectService(req.params.projectId);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: err.message,
    });
  }
};
