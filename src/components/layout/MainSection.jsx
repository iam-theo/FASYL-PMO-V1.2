import { useState } from 'react'
import Dashboard from './Dashboard'
import Projects from '../projects/Projects'
import ProjectWorkspace from '../projects/tasks/ProjectWorkspace'
import AuditLogsPage from './AuditLogsPage'

function MainSection({
    activeTab,
    setActiveTab,
    selectedProject,
    setSelectedProject,
    projects,
    setProjects,
    projectManagers,
    user,
    isLoading,
    setOpenProject,
    openProject,
    setIsSetupModalOpen,
    activeSubTab,
    setActiveSubTab,
    }) {

    const [currentPage, setCurrentPage] = useState(1)
    const [value, setValue] = useState("")
    const [filter, setFilter] = useState("")

    const safeProjects = Array.isArray(projects) ? projects : []

    // console.log(safeProjects);

    let filteredProjects = safeProjects.filter((project) => {
        if (user?.role === "HEADOFOPS") return true; // sees everything

        if (user?.role === "PROJECTMANAGER") {
            return project.projectManager?.email === user.email;
            // only projects assigned
        }

        if (user?.role === "STAFF") {
            const email = (user.email || "").toLowerCase();

            // Staff are project resources; only show the projects they are on.
            return (Array.isArray(project.resources) ? project.resources : []).some(
                (resource) => (resource.email || "").toLowerCase() === email
            );
        }

        return false;
    });

    // console.log(filteredProjects);

    if (value) {
        filteredProjects = filteredProjects.filter((project) => project.projectName.toLowerCase().includes(value.toLowerCase()))
    }

    if (filter && filter !== "all") {
        filteredProjects = filteredProjects.filter((project) => 
            project.workflowStatus.toLowerCase() === filter.toLowerCase()
        )
    }

    
    const itemsPerPage = 10
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentProjects = filteredProjects.slice(
        startIndex, startIndex + itemsPerPage
    )

    return (
        // The header (TopBar) is a sibling above this; only this region scrolls.
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-canvas">
            {activeTab === "dashboard" && openProject === false && (
                <Dashboard
                    projects={projects}
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                    setOpenProject={setOpenProject}
                    setActiveSubTab={setActiveSubTab}
                />
            )}

            {activeTab === "projects" && openProject === false && (
                <Projects
                    projects={projects} 
                    currentProjects={currentProjects}
                    searchValue={value}
                    setSearchValue={setValue} 
                    filterValue={filter}
                    setFilterValue={setFilter} 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    setCurrentPage={setCurrentPage} 
                    itemsPerPage={itemsPerPage}
                    setSelectedProject={setSelectedProject}
                    user={user} 
                    isLoading={isLoading}
                    setOpenProject={setOpenProject}
                    setActiveSubTab={setActiveSubTab}
                />
            )}

            {activeTab === "audit" && openProject === false && user?.role === "HEADOFOPS" && (
                <AuditLogsPage user={user} />
            )}

            {openProject === true && selectedProject?.projectManager && (
                <ProjectWorkspace 
                    project={selectedProject}
                    setProject={setSelectedProject}
                    projects={projects}
                    setProjects={setProjects}
                    projectManagers={projectManagers}
                    user={user}
                    setIsSetupModalOpen={setIsSetupModalOpen}
                    activeSubTab={activeSubTab}
                    setActiveSubTab={setActiveSubTab}
                    onNavigateToDashboard={() => {
                        setActiveTab("dashboard");
                        setOpenProject(false);
                    }}
                    onNavigateToProjects={() => {
                        setActiveTab("projects");
                        setOpenProject(false);
                    }}
                />
            )}
        </main>
    )
}

export default MainSection
