import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { NotificationProvider } from "./components/NotificationContext.jsx";

import { configureReports } from "./components/reports";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) ?? null;
  } catch {
    return null;
  }
};

/**
 * The Reports module's only integration seam. It reads auth from the same
 * localStorage keys SignIn writes, so there is no second session to maintain.
 */
configureReports({
  // Same fallback as src/api.js, so both clients agree when .env is missing.
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1",
  timeoutMs: 20000,
  getAuthToken: () => localStorage.getItem("token"),
  getCurrentUserId: () => readUser()?.id ?? null,

  /**
   * Same visibility rule MainSection applies to the projects list: head of ops
   * sees everything, a project manager sees only what they are assigned. Kept
   * here rather than inside the module because it is this app's policy.
   *
   * Reports follow their project, so a PM's report list narrows to match.
   */
  filterProjects: (projects) => {
    const user = readUser();
    if (!user) return [];
    if (user.role === "HEADOFOPS") return projects;
    if (user.role === "PROJECTMANAGER") {
      return projects.filter(
        (project) => project.projectManagerEmail === user.email,
      );
    }
    return [];
  },
  onUnauthorized: () => {
    // Guarded: with no token we were never signed in, and wiping + reloading
    // here produces a redirect loop that looks like broken login.
    if (!localStorage.getItem("token")) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/");
  },
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </BrowserRouter>,
);
