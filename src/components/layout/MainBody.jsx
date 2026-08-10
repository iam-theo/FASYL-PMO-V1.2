import { useState, useEffect, useCallback } from "react";
import { useOutlet, useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import MainSection from "./MainSection";
import AddProjectManager from "../projects/AddProjectManager";
import { api } from "../../api";
import SetupProjectModal from "../projects/tasks/SetupProjectModal";
import TopBar from "./TopBar";
import { REPORTS_BASE_PATH, resetReportsCache } from "../reports";
import { startRealtime, stopRealtime, useRealtimeEvent } from "../../realtime";

function MainBody({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      resetReportsCache();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }
  };
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openProject, setOpenProject] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Collapse state is owned here because two children need it: SideBar renders
   * at that width, TopBar renders the control. Persisted so the choice survives
   * a refresh.
   */
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("pmo.sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("pmo.sidebarCollapsed", String(next));
      } catch {
        // Private browsing can refuse writes; the rail still works this session.
      }
      return next;
    });
  };

  const [selectedProject, setSelectedProject] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [assignedManager, setAssignedManager] = useState(
    "Select A Project Manager",
  );
  const [isLoading] = useState(false);

  // Keep the selected project pointing at the freshest copy from the list.
  const idToMatch =
    selectedProject?.projectId || selectedProject?.id || selectedProject?._id;
  const currentProject = idToMatch
    ? projects.find(
        (p) =>
          p.projectId === idToMatch || p.id === idToMatch || p._id === idToMatch,
      ) ?? selectedProject
    : selectedProject;

  //initial loading of projects
  const loadProjects = useCallback(async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadProjectManagers = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/project-managers");
      setProjectManagers(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    startRealtime(() => localStorage.getItem("token"));
    return () => stopRealtime();
  }, []);

  useRealtimeEvent("projects:updated", loadProjects);

  useEffect(() => {
    loadProjects();
    if (user?.role === "HEADOFOPS") {
      loadProjectManagers();
    }
  }, [user?.role, loadProjects, loadProjectManagers]);

  // Non-null only when a child route (i.e. reports) matched.
  const outlet = useOutlet();
  const isReportsRoute = Boolean(outlet);

  // Landing directly on /app/reports still highlights the sidebar item.
  const displayTab = isReportsRoute ? "reports" : activeTab;

  // The sidebar drives tabs by state, but reports is a real route — so this
  // translates a tab click into navigation and keeps the two in sync.
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "reports") navigate(REPORTS_BASE_PATH);
    else if (isReportsRoute) navigate("/app");
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[1440px] h-screen overflow-hidden bg-canvas">
      <SideBar
        activeTab={displayTab}
        setActiveTab={handleTabChange}
        handleLogout={handleLogout}
        setOpenProject={setOpenProject}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        user={user}
      />

      {currentProject &&
        user.role === "HEADOFOPS" &&
        !currentProject?.projectManager && (
          <AddProjectManager
            projects={projects}
            setProjects={setProjects}
            selectedProject={currentProject}
            setSelectedProject={setSelectedProject}
            onClose={() => {
              setActiveTab("projects");
              setOpenProject(false);
              setSelectedProject(null);
            }}
            projectManagers={projectManagers}
            assignedManager={assignedManager}
            setAssignedManager={setAssignedManager}
            user={user}
          />
        )}

      {/* Content column. The sidebar is in-flow on desktop, so flex reserves its
          width and nothing needs a matching offset; on mobile the rail overlays
          and this column takes the full width. The header is a static child,
          and only the <main> below it scrolls. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={user}
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarOpen={isSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          handleLogout={handleLogout}
        />

        {isReportsRoute ? (
          <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
              {outlet}
            </div>
          </main>
        ) : (
          <MainSection
            projects={projects}
            setProjects={setProjects}
            projectManagers={projectManagers}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
            setOpenProject={setOpenProject}
            openProject={openProject}
            isSetupModalOpen={isSetupModalOpen}
            setIsSetupModalOpen={setIsSetupModalOpen}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            user={user}
            isLoading={isLoading}
          />
        )}
      </div>

      {isSetupModalOpen && (
        <SetupProjectModal
          project={currentProject}
          onClose={() => setIsSetupModalOpen(false)}
        />
      )}
    </div>
  );
}

export default MainBody;
