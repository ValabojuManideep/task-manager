import React, { useEffect } from "react";
import useAppStore from "./store/useAppStore";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import { TeamProvider } from "./context/TeamContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import TaskBoard from "./components/TaskBoard";
import Analytics from "./components/Analytics";
import Activity from "./components/Activity";
import TeamManagement from "./components/TeamManagement";
import Leaderboard from "./components/Leaderboard";
import Profile from "./components/Profile";
import Conversations from "./components/Conversations";
import UserManagement from "./components/UserManagement";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import TeamManagerDashboard from "./components/TeamManagerDashboard";
import "./App.css";

const queryClient = new QueryClient();

// Initialize dark mode on app load
function initializeDarkMode() {
  if (typeof document !== "undefined") {
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
    }
  }
}

initializeDarkMode();

function WithTasks({ children }) {
  return (
    <TaskProvider>
      <TeamProvider>
        {children}
      </TeamProvider>
    </TaskProvider>
  );
}

function AppLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  useEffect(() => {
    // Apply dark mode to root and body elements whenever it changes
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark-mode", darkMode);
      document.body.classList.toggle("dark-mode", darkMode);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left"></div>
          <div className="top-bar-right">
            <button
              className="leaderboard-header-btn"
              title="Leaderboard"
              onClick={() => navigate("/leaderboard")}
              style={{ marginLeft: 8, marginRight: 8 }}
            >
              🏅
            </button>
            <button className="dark-mode-toggle" onClick={toggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button className="logout-btn" onClick={logout}>
              <span>→</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <WithTasks>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/team"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TaskBoard taskType="team" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/user"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TaskBoard taskType="user" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={<Navigate to="/tasks/team" replace />}
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Analytics />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Activity />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* ✅ FIX: Team Manager Dashboard route */}
              <Route
                path="/team-manager"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TeamManagerDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Teams route for team management */}
              <Route
                path="/teams"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TeamManagement />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Leaderboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Conversations />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WithTasks>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
