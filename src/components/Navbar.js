import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Navbar.css";
import useAppStore from "../store/useAppStore";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  console.log('NAVBAR USER:', user);
  const expandTasks = useAppStore((s) => s.navbar_expandTasks);
  const setExpandTasks = useAppStore((s) => s.setNavbar_expandTasks);
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  // ✅ FIX: Get role information correctly
  const isAdmin = user?.role === "admin";
  const isTeamManager = user?.role === "team-manager";

  useEffect(() => {
    // keep expansion in sync with current location on mount/navigation
    setExpandTasks(location.pathname.startsWith("/tasks"));
  }, [location.pathname, setExpandTasks]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const isTasksActive = location.pathname.startsWith("/tasks");
  const isTeamTasksActive = location.pathname === "/tasks/team";
  const isUserTasksActive = location.pathname === "/tasks/user";
  const isDashboardActive = location.pathname === "/";
  const isChatActive = location.pathname === "/chat";

  return (
  <>
    {/* Desktop Sidebar Navigation */}
    <div className="navbar">

      {/* Header */}
      <div className="navbar-header">
        <div className="logo-icon">☑</div>
        <div className="logo-text">TaskFlow</div>
      </div>

      {/* Navigation */}
      <div className="nav-section">
        <div className="nav-title">Navigation</div>

        {/* Dashboard */}
        <Link
          to="/"
          className={`nav-item ${isDashboardActive ? "active" : ""}`}
        >
          <span className="nav-icon">▦</span>
          <span className="nav-label">Dashboard</span>
        </Link>

        {/* Tasks */}
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

        {/* Chat */}
        {!isAdmin && (
          <Link
            to="/chat"
            className={`nav-item ${location.pathname === "/chat" ? "active" : ""}`}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">Chat</span>
          </Link>
        )}

        {/* Profile */}
        <Link
          to="/profile"
          className={`nav-item ${location.pathname === "/profile" ? "active" : ""}`}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </Link>

        {/* My Teams (for Team Managers only) */}
        {isTeamManager && (
          <Link
            to="/team-manager"
            className={`nav-item ${location.pathname === "/team-manager" ? "active" : ""}`}
          >
            <span className="nav-icon">👨‍💼</span>
            <span className="nav-label">My Teams</span>
          </Link>
        )}

        {/* Teams */}
        {(isAdmin || isTeamManager) && (
          <Link
            to="/teams"
            className={`nav-item ${location.pathname === "/teams" ? "active" : ""}`}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Teams</span>
          </Link>
        )}

        {/* User Management */}
        {isAdmin && (
          <Link
            to="/admin/users"
            className={`nav-item ${location.pathname === "/admin/users" ? "active" : ""}`}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">User Management</span>
          </Link>
        )}
      </div>

      {/* Footer */}
      <div className="navbar-footer">
        <div className="user-avatar" title={user?.username}>{getInitials(user?.username)}</div>
        <div className="user-info role-first">
          <span className="user-role-badge">
            {user && user.role ? (user.role === "team-manager" ? "Team Manager" : user.role === "admin" ? "Admin" : "User") : "User"}
          </span>
          <div className="user-name">{user?.username || "User"}</div>
        </div>
      </div>

    </div>

    {/* Mobile Bottom Navigation stays unchanged */}
    <div className="mobile-nav">
      {/* ... your mobile nav code ... */}
    </div>
  </>
);

}
