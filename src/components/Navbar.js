import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "▦" },
    { path: "/tasks", label: "Tasks", icon: "☑" },
    { path: "/analytics", label: "Analytics", icon: "📊" },
    { path: "/activity", label: "Activity", icon: "📈" },
  ];

  const getInitials = (name) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
  };

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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
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
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
