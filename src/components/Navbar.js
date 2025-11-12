import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expandTasks, setExpandTasks] = useState(
    location.pathname.startsWith("/tasks")
  );

  const isAdmin = user?.role === "admin";

  const getInitials = (name) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
  };

  const isTasksActive = location.pathname.startsWith("/tasks");
  const isTeamTasksActive = location.pathname === "/tasks/team";
  const isUserTasksActive = location.pathname === "/tasks/user";
  const isDashboardActive = location.pathname === "/";

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <div className="navbar">
        <div className="navbar-header">
          <div className="logo-icon">☑</div>
          <div className="logo-text">TaskFlow</div>
          
          {/* Mobile actions in header */}
          <div className="mobile-header-actions">
            <button className="mobile-theme-btn" onClick={toggleDarkMode}>
              🌙
            </button>
            <button className="mobile-logout-btn" onClick={logout}>
              →
            </button>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title">Navigation</div>
          
          {/* Dashboard - First */}
          <Link
            to="/"
            className={`nav-item ${isDashboardActive ? "active" : ""}`}
          >
            <span className="nav-icon">▦</span>
            <span className="nav-label">Dashboard</span>
          </Link>

          {/* Tasks with Sub-items - Second */}
          <div className="nav-item-with-subitems">
            <button 
              className={`nav-item nav-item-expandable ${isTasksActive ? "active" : ""}`}
              onClick={() => setExpandTasks(!expandTasks)}
            >
              <span className="nav-icon">☑</span>
              <span className="nav-label">Tasks</span>
              <span className={`expand-icon ${expandTasks ? "expanded" : ""}`}>▶</span>
            </button>
            
            {expandTasks && (
              <div className="nav-subitems">
                <Link
                  to="/tasks/team"
                  className={`nav-subitem ${isTeamTasksActive ? "active" : ""}`}
                >
                  <span className="subitem-icon">👥</span>
                  <span>Team Tasks</span>
                </Link>
                <Link
                  to="/tasks/user"
                  className={`nav-subitem ${isUserTasksActive ? "active" : ""}`}
                >
                  <span className="subitem-icon">👤</span>
                  <span>User Tasks</span>
                </Link>
              </div>
            )}
          </div>

          {/* Analytics */}
          <Link
            to="/analytics"
            className={`nav-item ${location.pathname === "/analytics" ? "active" : ""}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </Link>

          {/* Activity */}
          <Link
            to="/activity"
            className={`nav-item ${location.pathname === "/activity" ? "active" : ""}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Activity</span>
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            className={`nav-item ${location.pathname === "/profile" ? "active" : ""}`}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </Link>

          {/* Teams - Only for Admin */}
          {isAdmin && (
            <Link
              to="/teams"
              className={`nav-item ${location.pathname === "/teams" ? "active" : ""}`}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Teams</span>
            </Link>
          )}
        </div>

        <div className="navbar-footer">
          <div className="user-avatar">{getInitials(user?.username)}</div>
          <div className="user-info">
            <div className="user-name">{user?.username || "User"}</div>
            <div className="user-email">{user?.email || "No email"}</div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav">
        <Link
          to="/"
          className={`mobile-nav-item ${isDashboardActive ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">▦</span>
          <span>Dashboard</span>
        </Link>
        
        <Link
          to="/tasks/team"
          className={`mobile-nav-item ${isTeamTasksActive ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">👥</span>
          <span>Team</span>
        </Link>
        
        <Link
          to="/tasks/user"
          className={`mobile-nav-item ${isUserTasksActive ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">👤</span>
          <span>User</span>
        </Link>
        
        <Link
          to="/analytics"
          className={`mobile-nav-item ${location.pathname === "/analytics" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">📊</span>
          <span>Analytics</span>
        </Link>
        
        <Link
          to="/activity"
          className={`mobile-nav-item ${location.pathname === "/activity" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">📈</span>
          <span>Activity</span>
        </Link>

        <Link
          to="/profile"
          className={`mobile-nav-item ${location.pathname === "/profile" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">👤</span>
          <span>Profile</span>
        </Link>

        {isAdmin && (
          <Link
            to="/teams"
            className={`mobile-nav-item ${location.pathname === "/teams" ? "active" : ""}`}
          >
            <span className="mobile-nav-icon">👥</span>
            <span>Teams</span>
          </Link>
        )}
      </div>
    </>
  );
}
