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
      {/* Screen reader skip link */}
      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      
      {/* Navigation region - wrapped in semantic nav */}
      <Navbar />
      
      {/* Main content area */}
      <main className="main-content" role="main" id="main-content">
        {/* Top header bar */}
        <header className="top-bar" role="banner">
          <div className="top-bar-left">
            <h1 className="sr-only">TaskFlow Application</h1>
          </div>
          <div className="top-bar-right">
            <button
              className="leaderboard-header-btn"
              title="Leaderboard"
              onClick={() => navigate("/leaderboard")}
              aria-label="Go to leaderboard"
            >
              🏅
            </button>
            <button 
              className="dark-mode-toggle" 
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={darkMode}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button 
              className="logout-btn" 
              onClick={logout}
              aria-label="Logout from application"
            >
              <span aria-hidden="true">→</span>
              <span>Logout</span>
            </button>
          </div>
        </header>
        
        {/* Page content section */}
        <section className="page-content" aria-label="Page content">
          {children}
        </section>
      </main>
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
