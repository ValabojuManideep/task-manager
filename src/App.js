import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import TaskBoard from "./components/TaskBoard";
import Analytics from "./components/Analytics";
import Activity from "./components/Activity";
import Login from "./components/Login";
import "./App.css";

const queryClient = new QueryClient();

function WithTasks({ children }) {
  const { user } = useAuth();
  return <TaskProvider userId={user?.id}>{children}</TaskProvider>;
}

function AppLayout({ children }) {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left"></div>
          <div className="top-bar-right">
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
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TaskBoard />
                    </AppLayout>
                  </ProtectedRoute>
                }
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WithTasks>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
