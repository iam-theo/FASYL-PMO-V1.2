import { useState, useEffect } from 'react'
import ProjectBreadcrumb from './ProjectBreadcrumb'
import ProjectSubTabs from './ProjectSubTabs'
import ProjectOnboardingEmptyState from './ProjectOnboardingEmptyState'
import OverviewTab from './overview/OverviewTab'
import ResourcesTab from './resources/ResourcesTab'
import TasksTab from './tasks/TasksTab'
import CalendarTab from './calender/CalendarTab'
import ReportsTab from './reports/ReportsTab'
import ViewProjectsBody from '../ViewProjectsBody';
import { getTasks } from '../../../api'

function ProjectWorkspace({ 
    project, 
    setProject,
    projects,
    setProjects,
    projectManagers,
    user,
    onNavigateToDashboard, 
    onNavigateToProjects,  
    setIsSetupModalOpen,
    activeSubTab,
    setActiveSubTab,
    activeDetails,
    setActiveDetails
}) {
    // const [activeTab, setActiveTab] = useState("overview")
    const resources = project?.resources;

    const [tasks, setTasks] = useState([]);

    const { projectId, currentStageOrder } = project

    const canManageTasksAndReports = ["HEADOFOPS", "PROJECTMANAGER"].includes(user?.role);

    const isStaff = user?.role === "STAFF";

    useEffect(() => {

        const loadTasks = async () => {
            try {
                const response  = await getTasks(projectId, currentStageOrder);

                let stageTasks = Array.isArray(response.data) ? response.data : [];

                if (isStaff) {
                    const resources = Array.isArray(project?.resources) ? project.resources : [];
                    const me = resources.find(
                        (resource) =>
                            (resource.email || "").toLowerCase() ===
                            (user?.email || "").toLowerCase(),
                    );

                    stageTasks = me
                        ? stageTasks.filter(
                            (task) =>
                                task.assignedResourceId === me.recordId ||
                                task.assignee?.id === me.recordId
                          )
                        : [];
                }

                setTasks(stageTasks);

            } catch (err) {
                console.error(err);
            }
        };

        loadTasks();
    }, [projectId, currentStageOrder, isStaff, user?.email, project?.resources])

    const isSetupComplete = (project?.resources?.length ?? 0) > 0

    return (
        <div className='flex flex-col h-full'>
            <div className='px-4 pt-4'>
                <ProjectBreadcrumb
                    items={[
                        { label: "Dashboard", onClick: onNavigateToDashboard },
                        { label: "Projects", onClick: onNavigateToProjects },
                        { label: project?.projectName ?? "Project" },
                    ]}
                />
            </div>

            <div className='px-4 pt-6'>
                <ProjectSubTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} user={user} />
            </div>

            <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar'>
                {activeSubTab === "overview" && (
                    isSetupComplete ? (
                        <OverviewTab
                            project={project}
                            tasks={tasks}
                            setTasks={setTasks}
                            onNavigateToTasks={() => setActiveSubTab("tasks")}
                            onNavigateToResources={() => setActiveSubTab("resources")}
                            readOnly={isStaff}
                        />
                    ) : (
                        <ProjectOnboardingEmptyState onSetupProject={() => setIsSetupModalOpen(true)} />
                    )
                )}

                {activeSubTab === "resources" && (
                    <ResourcesTab 
                        project={project}
                    />
                )}

                {activeSubTab === "tasks" && (
                    <TasksTab 
                        tasks={tasks} 
                        setTasks={setTasks} 
                        resources={resources}
                        loggedInUser={user}
                        projectManagers={projectManagers}
                        project={project}
                        setProject={setProject}
                        readOnly={isStaff}
                    />
                )}

                {canManageTasksAndReports && activeSubTab === "calendar" && (
                    <CalendarTab 
                        tasks={tasks} 
                        setTasks={setTasks} 
                    />
                )}

                {canManageTasksAndReports && activeSubTab === "reports" && (
                    <ReportsTab project={project} tasks={tasks} user={user} />
                )}

                {!isStaff && activeSubTab === "project_lifecycle" && (
                    <ViewProjectsBody
                        projects={projects}
                        setProjects={setProjects}
                        selectedProject={project}
                        setSelectedProject={setProject}
                        onClose={() => setActiveSubTab("overview")}
                        activeDetails={activeDetails}
                        setActiveDetails={setActiveDetails}
                        user={user}
                    />
                )}
            </div>
        </div>
    )
}

export default ProjectWorkspace
