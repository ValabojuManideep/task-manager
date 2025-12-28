import React, { useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import useAppStore from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  // Export logic for user dashboard (Zustand)
  const showExportModal = useAppStore((s) => s.dashboard_showExportModal);
  const setShowExportModal = useAppStore((s) => s.setDashboard_showExportModal);
  const exportFormat = useAppStore((s) => s.dashboard_exportFormat);
  const setExportFormat = useAppStore((s) => s.setDashboard_exportFormat);

  function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    const exportUser = { username: user.username, email: user.email, role: user.role, createdAt: user.createdAt, _id: user.id || user._id };
    const exportTasks = userTasks.map(t => ({
      title: t.title,
      description: t.description,
      status: t.status,
      assignedTo: t.assignedTo?._id || t.assignedTo,
      dueDate: t.dueDate,
      isRecurrent: t.isRecurrent,
      recurrencePattern: t.recurrencePattern,
      recurrenceEndDate: t.recurrenceEndDate,
      completionLog: t.completionLog,
      createdAt: t.createdAt,
      _id: t._id
    }));
    const userId = user.id || user._id;
    const exportTeams = teams.filter(team =>
      team.members?.some(member => (member._id || member) === userId)
    ).map(t => ({
      name: t.name,
      description: t.description,
      members: t.members,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      _id: t._id
    }));

    if (exportFormat === "xlsx") {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const wsUser = XLSX.utils.json_to_sheet([exportUser]);
      const wsTeams = XLSX.utils.json_to_sheet(exportTeams);
      const wsTasks = XLSX.utils.json_to_sheet(exportTasks);
      XLSX.utils.book_append_sheet(wb, wsUser, 'User');
      XLSX.utils.book_append_sheet(wb, wsTeams, 'Teams');
      XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadFile(wbout, `user_export_${user.username}_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      const data = JSON.stringify({ user: exportUser, teams: exportTeams, tasks: exportTasks }, null, 2);
      const filename = `user_export_${user.username}_${Date.now()}.json`;
      downloadFile(data, filename, "application/json");
    }
    setShowExportModal(false);
  }

  const allTasks = useAppStore((s) => s.allTasks);
  const teams = useAppStore((s) => s.teams);
  const { user, isAdmin, isTeamManager } = useAuth();
  const navigate = useNavigate();

  const managedTeams = useMemo(() => {
    if (!isTeamManager) return [];
    return teams.filter(team => 
      team.teamManagers?.some(manager => 
        (manager._id || manager) === (user.id || user._id)
      )
    );
  }, [teams, user, isTeamManager]);

  const userTasks = useMemo(() => {
    if (isAdmin) return allTasks;
    
    if (isTeamManager) {
      const managedTeamIds = managedTeams.map(t => t._id);
      return allTasks.filter(task => {
        if (task.isTeamTask && managedTeamIds.includes(task.assignedToTeam?._id)) {
          return true;
        }
        if (task.assignedTo?._id === user.id || task.assignedTo === user.id) {
          return true;
        }
        return false;
      });
    }
    
    return allTasks.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id);
  }, [allTasks, user, isAdmin, isTeamManager, managedTeams]);

  const teamTasks = useMemo(() => {
    if (isAdmin) {
      return allTasks.filter(t => t.isTeamTask === true);
    } else if (isTeamManager) {
      const managedTeamIds = managedTeams.map(t => t._id);
      return allTasks.filter(t => 
        t.isTeamTask && managedTeamIds.includes(t.assignedToTeam?._id)
      );
    } else {
      const currentUserId = user?.id || user?._id;
      return allTasks.filter(t => {
        if (!t.isTeamTask) return false;
        if (!t.assignedToTeam) return false;
        
        const teamMembers = t.assignedToTeam.members || [];
        return teamMembers.some(member => {
          const memberId = member._id || member;
          return String(memberId) === String(currentUserId);
        });
      });
    }
  }, [allTasks, user, isAdmin, isTeamManager, managedTeams]);

  const stats = useMemo(() => {
    const total = userTasks.length;
    const inProgress = userTasks.filter((t) => t.status === "in_progress").length;
    const completed = userTasks.filter((t) => t.status === "done").length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const teamCount = teamTasks.length;
    const managedTeamsCount = managedTeams.length;
    return { total, inProgress, completed, rate, teamCount, managedTeamsCount };
  }, [userTasks, teamTasks, managedTeams]);

  const recentTasks = useMemo(() => {
    return [...userTasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [userTasks]);

  const getDashboardTitle = () => {
    if (isAdmin) return "Admin Dashboard";
    if (isTeamManager) return "Team Manager Dashboard";
    return "Dashboard";
  };

  const getDashboardSubtitle = () => {
    if (isAdmin) return "Overview of all tasks and progress";
    if (isTeamManager) return `Managing ${stats.managedTeamsCount} team${stats.managedTeamsCount !== 1 ? 's' : ''}`;
    return "Your tasks and progress";
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Header Section */}
      <header className="dashboard-header">
        <div>
          <h1 className="page-title" id="dashboard-title">{getDashboardTitle()}</h1>
          <p className="page-subtitle">{getDashboardSubtitle()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="view-all-btn" 
            onClick={() => navigate("/tasks/team")}
            aria-label="View all tasks"
          > 
            View All Tasks
          </button>
          {!isAdmin && (
            <button
              className="export-btn"
              onClick={() => setShowExportModal(true)}
              aria-label="Export your data"
            >
              Export Data
            </button>
          )}
          
          {/* Export Modal */}
          {showExportModal && (
            <div 
              className="export-modal-overlay"
              role="dialog"
              aria-labelledby="export-modal-title"
              aria-modal="true"
            >
              <div className="export-modal-content">
                <button
                  className="export-modal-close"
                  aria-label="Close export modal"
                  onClick={() => setShowExportModal(false)}
                >
                  &times;
                </button>
                <h2 id="export-modal-title" className="export-modal-title">Export Data</h2>
                <p className="export-modal-subtitle">Choose export format:</p>
                <button
                  className="export-format-btn xlsx-btn"
                  onClick={() => { setExportFormat('xlsx'); handleExport(); }}
                  aria-label="Export as Excel file"
                >
                  Excel (XLSX)
                </button>
                <button
                  className="export-format-btn json-btn"
                  onClick={() => { setExportFormat('json'); handleExport(); }}
                  aria-label="Export as JSON file"
                >
                  JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Statistics Section */}
      <section className="stats-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Statistics Overview</h2>
        <div className="stats-grid" role="list">
          <div className="stat-card" role="listitem">
            <div className="stat-icon" aria-hidden="true">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-description">
                {isTeamManager ? "Managed Tasks" : "Total Tasks"}
              </div>
            </div>
          </div>

          {isTeamManager && (
            <div className="stat-card" role="listitem">
              <div className="stat-icon" aria-hidden="true">👔</div>
              <div className="stat-content">
                <div className="stat-value">{stats.managedTeamsCount}</div>
                <div className="stat-description">Managed Teams</div>
              </div>
            </div>
          )}

          <div className="stat-card" role="listitem">
            <div className="stat-icon" aria-hidden="true">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.teamCount}</div>
              <div className="stat-description">Team Tasks</div>
            </div>
          </div>

          <div className="stat-card" role="listitem">
            <div className="stat-icon" aria-hidden="true">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-description">In Progress</div>
            </div>
          </div>

          <div className="stat-card" role="listitem">
            <div className="stat-icon" aria-hidden="true">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-description">Completed</div>
            </div>
          </div>

          <div className="stat-card" role="listitem">
            <div className="stat-icon" aria-hidden="true">📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.rate}%</div>
              <div className="stat-description">Completion Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Tasks Section */}
      <section className="recent-tasks-section" aria-labelledby="recent-tasks-heading">
        <h2 id="recent-tasks-heading" className="section-title">Recent Tasks</h2>
        {recentTasks.length > 0 ? (
          <ul className="task-list" role="list">
            {recentTasks.map((task) => (
              <li key={task._id} className="task-item">
                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <div className="task-meta">
                    <span className={`task-status status-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`task-priority priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    {task.isTeamTask && (
                      <span className="task-type-badge">
                        <span aria-hidden="true">👥</span> Team
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-tasks">No tasks yet</p>
        )}
      </section>
    </div>
  );
}
