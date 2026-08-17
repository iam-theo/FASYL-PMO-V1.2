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

/* =========================================
    RESOURCE MERGE
========================================= */
// The Sales API owns the project's core fields, but resources are also
// managed in the PMO app (the PM adds staff with MAN-… recordIds the Sales
// payload knows nothing about). A blind overwrite on every sync would wipe
// those PMO-side assignments within a minute, so the sync merges instead:
// sales entries update matching rows in place, PMO-added entries survive,
// and nothing is ever dropped.
export const mergeResources = (existing, incoming) => {
    const existingList = Array.isArray(existing) ? existing : [];
    const incomingList = Array.isArray(incoming) ? incoming : [];

    const aliases = (r) => {
        const set = new Set();
        if (r?.recordId) set.add(`recordId:${String(r.recordId).trim()}`);
        if (r?.staffId) set.add(`staffId:${String(r.staffId).trim()}`);
        if (r?.email) set.add(`email:${String(r.email).trim().toLowerCase()}`);
        return set;
    };

    // Index existing entries by every alias they expose so an incoming row
    // can match even when one system uses a different recordId for the same
    // person (e.g. PMO-added MAN-… vs sales EMP-…).
    const byAlias = new Map();
    const merged = [];

    existingList.forEach((r) => {
        const index = merged.length;
        merged.push({ ...r });
        for (const alias of aliases(r)) byAlias.set(alias, index);
    });

    for (const r of incomingList) {
        const keys = [...aliases(r)];
        if (!keys.length) continue; // no identity to merge on — skip rather than duplicate

        let match = null;
        for (const key of keys) {
            if (byAlias.has(key)) {
                match = byAlias.get(key);
                break;
            }
        }

        if (match !== null) {
            merged[match] = { ...r }; // Sales data wins for the shared identity
        } else {
            const index = merged.length;
            merged.push({ ...r });
            for (const key of keys) byAlias.set(key, index);
        }
    }

    return merged;
};

export const syncProjects = async (projects) => {
    for (const p of projects) {
        const mapped = mapSalesToPMOProject(p);

        const existing = await prisma.project.findUnique({
            where: { projectId: mapped.projectId },
        });

        let project;

        if (existing) {
            // Merge instead of replace so resources added in the PMO app
            // survive the sync; only write the column when it really changed
            // (keeps the cron from rewriting every row on every tick).
            const mergedResources = mergeResources(
                existing.resources,
                mapped.resources
            );

            const update = { ...mapped };

            if (
                JSON.stringify(mergedResources) ===
                JSON.stringify(existing.resources)
            ) {
                delete update.resources;
            } else {
                update.resources = mergedResources;
            }

            project = await prisma.project.update({
                where: { projectId: mapped.projectId },
                data: update,
            });
        } else {
            project = await prisma.project.create({
                data: {
                    ...mapped,
                    source: "SALES",
                    workflowStatus: "UNASSIGNED",
                    currentStageOrder: 0,
                },
            });
        }

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

    // console.log(projects);

    if (!Array.isArray(projects)) {
        throw new Error("Invalid Sales API response");
    }

    await syncProjects(projects);

    return {
        success: true,
        count: projects.length,
    };
};