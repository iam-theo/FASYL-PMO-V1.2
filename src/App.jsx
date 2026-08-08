import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import SignIn from "./components/auth/SignIn";
import MainBody from "./components/layout/MainBody";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useNotification } from "./components/NotificationContext";
import GlobalLoader from "./components/layout/GlobalLoader";
import { ReportsRoutes, REPORTS_BASE_PATH } from "./components/reports";

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const { notification } = useNotification();

  return (
    <>
      {/* ============ NOTIFICATION UI ============ */}
      <div
        className={`bg-[#FFFFFF] shadow-[#1018280D] shadow-md rounded-lg p-4 flex items-start justify-between gap-4 fixed z-4000 top-5 right-5 w-100 min-h-24.5 cursor-pointer transition-all duration-300 ease-in-out
          ${
            notification
              ? "opacity-100 translate-x-0 scale-100"
              : "opacity-0 translate-x-10 scale-95 blur-sm pointer-events-none"
          }`}
      >
        {notification?.type === "success" ? (
          <FaCheckCircle className="text-[#D1FADF] text-2xl bg-[#1CA466] rounded-full border-2 border-[#1CA466]" />
        ) : notification?.type === "error" ? (
          <FaExclamationCircle className="text-[#e5969f] text-2xl bg-[#D20019] rounded-full border-2 border-[#D20019]" />
        ) : null}
        <div className="flex-1">
          <p className="font-medium text-[14px]/[20px] text-[#090909] mb-1">
            {notification?.title}
          </p>
          <p className="font-normal text-[14px]/[20px] text-[#636363]">
            {notification?.message}
          </p>
        </div>
      </div>

      <GlobalLoader />

      <Routes>
        <Route path="/" element={<SignIn setUser={setUser} />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute user={user}>
              <MainBody user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        >
          {/*
            Renders into MainBody's <Outlet />, so reports keep the sidebar and
            header. The trailing /* is required — ReportsRoutes owns every path
            below this one (new, :reportId, :reportId/edit).
          */}
          {!["HEADOFOPS", "PROJECTMANAGER"].includes(user?.role) ? (
            <Route path="reports/*" element={<Navigate to="/app" replace />} />
          ) : (
            <Route path="reports/*" element={<ReportsRoutes />} />
          )}
        </Route>

        {/* Reports used to live at the top level; old links still resolve. */}
        <Route
          path="/reports/*"
          element={<Navigate to={REPORTS_BASE_PATH} replace />}
        />
      </Routes>
    </>
  );
}

export default App;
