import { useState, useEffect } from 'react'
import ProjectBreadcrumb from './ProjectBreadcrumb'
import ProjectSubTabs from './ProjectSubTabs'
import ProjectOnboardingEmptyState from './ProjectOnboardingEmptyState'
import OverviewTab from './overview/OverviewTab'
import ResourcesTab from './resources/ResourcesTab'
import TasksTab from './tasks/TasksTab'
import CalendarTab from './calender/CalendarTab'
import ReportsTab from './reports/ReportsTab'
import ProjectLifeCycle from '../lifecycle/ProjectLifeCycle'
import AddProjectManager from '../AddProjectManager';
import { getTasks } from '../../../api'

function ProjectWorkspace({ 
    project, 
    setProject,
    setProjects,
    projectManagers,
    user,
    onNavigateToDashboard, 
    onNavigateToProjects,  
    setIsSetupModalOpen,
    activeSubTab,
    setActiveSubTab,
}) {
    // const [activeTab, setActiveTab] = useState("overview")
    const resources = project?.resources;

    const [tasks, setTasks] = useState([]);

    const [isAssignPMModalOpen, setIsAssignPMModalOpen] = useState(false)
    const [assignedManager, setAssignedManager] = useState("Select A Project Manager")

    const { projectId, currentStageOrder } = project

    const canManageTasksAndReports = ["HEADOFOPS", "PROJECTMANAGER"].includes(user?.role);

    const isStaff = user?.role === "STAFF";

    const isHeadOfOps = user?.role === "HEADOFOPS";

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
            <div className='px-4 pt-4 flex items-center justify-between gap-3 flex-wrap'>
                <ProjectBreadcrumb
                    items={[
                        { label: "Dashboard", onClick: onNavigateToDashboard },
                        { label: "Projects", onClick: onNavigateToProjects },
                        { label: project?.projectName ?? "Project" },
                    ]}
                />

                {isHeadOfOps && (
                    <button
                        type="button"
                        onClick={() => {
                            setAssignedManager(project?.projectManager?.email ?? "Select A Project Manager");
                            setIsAssignPMModalOpen(true);
                        }}
                        className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#1B3C4A] flex items-center gap-2 cursor-pointer'
                    >
                        <i className="fa-solid fa-user-pen text-[#FFFFFF]"></i>
                        <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Change Project Manager</span>
                    </button>
                )}
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
                            onNavigateToCalendar={canManageTasksAndReports ? () => setActiveSubTab("calendar") : undefined}
                            readOnly={isStaff}
                            viewOnly={isHeadOfOps}
                        />
                    ) : (
                        <ProjectOnboardingEmptyState onSetupProject={() => setIsSetupModalOpen(true)} />
                    )
                )}

                {activeSubTab === "resources" && (
                    <ResourcesTab 
                        project={project}
                        onProjectUpdate={(freshProject) => {
                            setProject(freshProject);
                            setProjects((prev) =>
                                Array.isArray(prev)
                                    ? prev.map((p) =>
                                        (p.id === freshProject?.id ||
                                            p.projectId === freshProject?.projectId)
                                            ? freshProject
                                            : p,
                                      )
                                    : prev,
                            );
                        }}
                        canManageResources={!isStaff}
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
                        viewOnly={isHeadOfOps}
                    />
                )}

                {canManageTasksAndReports && activeSubTab === "calendar" && (
                    <CalendarTab 
                        tasks={tasks} 
                        setTasks={setTasks} 
                        viewOnly={isHeadOfOps}
                    />
                )}

                {canManageTasksAndReports && activeSubTab === "reports" && (
                    <ReportsTab project={project} tasks={tasks} user={user} />
                )}

                {!isStaff && activeSubTab === "project_lifecycle" && (
                    <ProjectLifeCycle
                        selectedProject={project}
                        setSelectedProject={setProject}
                        setProjects={setProjects}
                        onClose={() => setActiveSubTab("overview")}
                        user={user}
                    />
                )}
            </div>

            {isAssignPMModalOpen && (
                <AddProjectManager
                    setProjects={setProjects}
                    selectedProject={project}
                    setSelectedProject={setProject}
                    onClose={() => setIsAssignPMModalOpen(false)}
                    projectManagers={projectManagers}
                    assignedManager={assignedManager}
                    setAssignedManager={setAssignedManager}
                    user={user}
                    title="Change Project Manager"
                    buttonLabel="Change Project Manager"
                />
            )}
        </div>
    )
}

export default ProjectWorkspace
