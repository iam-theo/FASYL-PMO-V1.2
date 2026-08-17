import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { buildWorkflowForProject } from "../modules/projects/project.service.js";

dotenv.config({
    path: "../.env",
});

const prisma = new PrismaClient();

const rebuildAllProjectWorkflows = async () => {
    const projects = await prisma.project.findMany({
        select: {
            projectId: true,
        },
    });

    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
        const stageCount = await prisma.projectStage.count({
            where: {
                projectId: project.projectId,
            },
        });

        if (stageCount > 0) {
            console.log(
                `Skipping ${project.projectId} - workflow already exists`
            );

            continue;
        }

        await prisma.project.update({
            where: {
                projectId: project.projectId,
            },
            data: {
                workflowStatus: "UNASSIGNED",
                currentStageOrder: 0,
                progressPercent: 0,
            },
        });

        await buildWorkflowForProject(project.projectId);

        console.log(
            `Workflow recreated for ${project.projectId}`
        );
    }

    return {
        success: true,
        count: projects.length,
    };
};

rebuildAllProjectWorkflows()
    .then((result) => {
        console.log("Workflow rebuild completed.");
        console.log(result);
    })
    .catch((error) => {
        console.error("Workflow rebuild failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });