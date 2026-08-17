import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import axios from "axios";
import { buildWorkflowForProject } from "./project.service.js";
import { broadcast } from "../realtime/realtime.service.js";
// import { notifyNewProject } from "../notifications/notification.service.js";

const fetchSalesProjects = async () => {
    const response = await axios.get(
        `${process.env.SALES_API_URL}/projects`
    );

    return response.data.data;
};

const mapSalesToPMOProject = (p) => {
    return {
        projectId: p.projectId,

        projectName: p.name,
        status: p.status,

        pmoAddress: p.pmoAddress || null,
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,

        clientId: p.client?.clientId || null,
        clientName: p.client?.name || null,

        productId: p.product?.productId || null,
        productName: p.product?.name || null,
        productType: p.product?.type || null,

        salesId: p.sales?.saleId || null,
        location: p.sales?.location || null,
        amcPercentage: p.sales?.amcPercentage || null,

        saleTypes: p.sales?.saleTypes
            ? JSON.stringify(p.sales.saleTypes)
            : "[]",

        milestones: p.milestones || [],
        resources: p.resources || [],
    };
};

export const syncProjects = async (projects) => {
    for (const p of projects) {
        const mapped = mapSalesToPMOProject(p);

        const existing = await prisma.project.findUnique({
            where: { projectId: mapped.projectId },
        });

        const project = await prisma.project.upsert({
            where: { projectId: mapped.projectId },

            update: {
                ...mapped,
            },

            create: {
                ...mapped,
                source: "SALES",
                workflowStatus: "UNASSIGNED",
                currentStageOrder: 0,
            },
        });

        if (!existing) {
            await buildWorkflowForProject(project.projectId);

            console.log(
                `Workflow created for new project: ${project.projectId}`
            );
            
            // const heads = await prisma.user.findMany({
            //     where: {
            //         role: "HEADOFOPS"
            //     }
            // });

            // for (const head of heads) {
            //     await notifyNewProject(head.id, project)
            // }
        }
    }

    if (projects.length > 0) {
        broadcast("data:changed", {
            module: "Projects",
            action: "Synced projects from Sales API",
            projectId: null,
        });
    }
}

export const syncSalesProjects = async () => {
    const projects = await fetchSalesProjects();

    if (!Array.isArray(projects)) {
        throw new Error("Invalid Sales API response");
    }

    await syncProjects(projects);

    return {
        success: true,
        count: projects.length,
    };
};