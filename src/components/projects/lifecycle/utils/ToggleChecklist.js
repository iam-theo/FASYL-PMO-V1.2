import { handleChecklist } from "../../../../api";

export const toggleChecklist = async (
    setProjects,
    setSelectedProject,
    projectId,
    stageId,
    itemId,
    user
) => {
    if (user.role !== "PROJECTMANAGER") return;

    let updatedChecklist = null;

    const updateProject = (project) => {
        if (!project || project.projectId !== projectId) return project;
        if (!Array.isArray(project.stages)) return project;

        return {
            ...project,
            stages: project.stages.map(stage => {
                if (stage.id !== stageId) return stage;
                if (!Array.isArray(stage.checklist)) return stage;

                const newChecklist = stage.checklist.map(item => {
                    if (item.id !== itemId) return item;

                    // Items linked to a required document are completed by the
                    // upload flow, never by a manual toggle.
                    if (item.requiredDoc) return item; // DO NOTHING

                    return {
                        ...item,
                        completed: !item.completed
                    };
                });

                updatedChecklist = newChecklist;

                return {
                    ...stage,
                    checklist: newChecklist,

                    // optional + required combined
                    completed: newChecklist.every(i => i.completed)
                };
            }),
        };
    };

    const replaceStage = (project, updatedStage) => {
        if (!project || project.projectId !== projectId) return project;
        if (!Array.isArray(project.stages)) return project;

        return {
            ...project,
            stages: project.stages.map(stage =>
                stage.id === updatedStage.id ? updatedStage : stage
            ),
        };
    };

    setProjects(prev =>
        (Array.isArray(prev) ? prev : []).map(updateProject)
    );

    // The modal renders from `selectedProject`, so it must be kept in sync too
    // or the tick never appears.
    setSelectedProject(prev =>
        prev && prev.projectId === projectId ? updateProject(prev) : prev
    );

    await new Promise(r => setTimeout(r, 0));

    if (!updatedChecklist) return;

    const res = await handleChecklist(projectId, stageId, updatedChecklist);

    // Reflect the authoritative stage (recomputed `completed`, repaired
    // requiredDoc links, completedAt) back into both stores.
    const updatedStage = res?.data;

    if (!updatedStage) return;

    setProjects(prev =>
        (Array.isArray(prev) ? prev : []).map(p =>
            replaceStage(p, updatedStage)
        )
    );

    setSelectedProject(prev =>
        prev && prev.projectId === projectId
            ? replaceStage(prev, updatedStage)
            : prev
    );
};
