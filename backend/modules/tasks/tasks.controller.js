import { PrismaClient } from "@prisma/client";
import { createTaskService, deleteTaskService, getAssignedTaskCountService, getTaskService, updateTaskService } from "./tasks.service.js";
import { storeUploadedFile } from "../../utils/upload.service.js";

const prisma = new PrismaClient();

// Create Task
export const createTask = async (req, res, next) => {
    try {

        const file = req.file;

        const document = file
            ? {
                fileUrl: await storeUploadedFile(file),
                fileName: file.originalname,
                fileType: file.mimetype
            }
            : null;

        const task = await createTaskService(req.body, req.user, document);

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });
        
    } catch (error) {
        console.error("Create task error:", error);

        if (error && error.name === "Error") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create task"
        });

        next(error);
    }
};


// Get All Tasks
export const getTasks = async (req, res, next) => {
    try {

        const { projectId, stageOrder } = req.params;

        const tasks = await getTaskService(
            projectId,
            Number(stageOrder)
        );


        return res.status(200).json({
            success: true,
            message: "Tasks retrieved successfully",
            data: tasks,
        });

    } catch (error) {
        console.error("Get tasks error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });

        next(error);
    }
};


// Get Assigned Task Count
export const getAssignedTaskCount = async (req, res, next) => {
    try {
        const count = await getAssignedTaskCountService(req.user);

        return res.status(200).json({
            success: true,
            message: "Assigned task count retrieved successfully",
            data: count,
        });
    } catch (error) {
        console.error("Get assigned task count error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch assigned task count",
        });

        next(error);
    }
};

// Get Single Task
export const getTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await prisma.task.findUnique({
        where: {
            id: Number(id)
        },
        include: {
            project: true,
            stage: true,
            assignedTo: {
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true
            }
            }
        }
        });

        if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
        }

        res.json(task);
    } catch (error) {
        console.error("Get task error:", error);

        res.status(500).json({
        message: "Failed to fetch task"
        });
    }
};


// Update Task
export const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;

        const body = { ...req.body };

        const file = req.file;

        if (file) {
            const document = {
                fileUrl: await storeUploadedFile(file),
                fileName: file.originalname,
                fileType: file.mimetype,
                purpose: "completion_proof",
                uploadedBy: req.user?.id ?? null,
                uploadedAt: new Date().toISOString()
            };

            body.documents = [document];
        }

        const task = await updateTaskService(
            Number(id),
            body,
            req.user
        )

        res.json({
            success: true,
            message: "Task updated successfully",
            data: task
        });

    } catch (error) {
        console.error("Update task error:", error);

        if (error && error.name === "Error") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update task"
        });

        next(error);
    }
};


// Delete Task
export const deleteTask = async (req, res, next) => {
    try {

        const { id } = req.params;

        const task = await deleteTaskService(Number(id));

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            data: task
        });

    } catch (error) {
        console.error("Delete task error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete task"
        });

        next(error);
    }
};