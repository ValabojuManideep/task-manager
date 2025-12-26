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
        // XLSX export: user, teams, tasks in separate sheets
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
        // JSON: all entities in one file
        const data = JSON.stringify({ user: exportUser, teams: exportTeams, tasks: exportTasks }, null, 2);
        const filename = `user_export_${user.username}_${Date.now()}.json`;
        downloadFile(data, filename, "application/json");
      }
      setShowExportModal(false);
    }
  const allTasks = useAppStore((s) => s.allTasks);
  const teams = useAppStore((s) => s.teams);
  const { user, isAdmin, isTeamManager } = useAuth(); // ✅ Use helper functions
  const navigate = useNavigate();

  // ✅ NEW: Get managed teams for team-manager
  const managedTeams = useMemo(() => {
    if (!isTeamManager) return [];
    return teams.filter(team => 
      team.teamManagers?.some(manager => 
        (manager._id || manager) === (user.id || user._id)
      )
    );
  }, [teams, user, isTeamManager]);

  // Filter tasks based on role
  const userTasks = useMemo(() => {
    if (isAdmin) return allTasks;
    
    // ✅ NEW: Team managers see all tasks from their managed teams
    if (isTeamManager) {
      const managedTeamIds = managedTeams.map(t => t._id);
      return allTasks.filter(task => {
        // Tasks assigned to managed teams
        if (task.isTeamTask && managedTeamIds.includes(task.assignedToTeam?._id)) {
          return true;
        }
        // Tasks assigned directly to team manager
        if (task.assignedTo?._id === user.id || task.assignedTo === user.id) {
          return true;
        }
        return false;
      });
    }
    
    return allTasks.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id);
  }, [allTasks, user, isAdmin, isTeamManager, managedTeams]);

  // Get team tasks for the user
  const teamTasks = useMemo(() => {
    if (isAdmin) {
      return allTasks.filter(t => t.isTeamTask === true);
    } else if (isTeamManager) {
      // ✅ NEW: Team managers see tasks from their managed teams
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
    const managedTeamsCount = managedTeams.length; // ✅ NEW
    return { total, inProgress, completed, rate, teamCount, managedTeamsCount };
  }, [userTasks, teamTasks, managedTeams]);

  const recentTasks = useMemo(() => {
    return [...userTasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [userTasks]);

  // ✅ NEW: Get role-specific title and subtitle
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
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">{getDashboardTitle()}</h1>
          <p className="page-subtitle">{getDashboardSubtitle()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="view-all-btn" onClick={() => navigate("/tasks/team")}> 
            View All Tasks
          </button>
          {/* Export Data button for user dashboard */}
          {!isAdmin && (
            <button
              className="export-btn"
              style={{
                padding: '12px 24px',
                background: '#0032E6',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,50,230,0.12)'
              }}
              onClick={() => setShowExportModal(true)}
            >
              Export Data
            </button>
          )}
          {/* Export format modal */}
          {showExportModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: document.body.classList.contains('dark-mode') ? 'rgba(17,24,39,0.7)' : 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                background: document.body.classList.contains('dark-mode')
                  ? 'linear-gradient(135deg, #1e293b 0%, #374151 100%)'
                  : 'linear-gradient(135deg, #f9fafb 0%, #e0e7ff 100%)',
                borderRadius: '16px',
                padding: '2.5rem 2rem 2rem 2rem',
                minWidth: '340px',
                boxShadow: document.body.classList.contains('dark-mode')
                  ? '0 8px 32px rgba(91,127,255,0.28)'
                  : '0 8px 32px rgba(91,127,255,0.18)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem',
                position: 'relative',
                border: document.body.classList.contains('dark-mode') ? '1px solid #374151' : '1px solid #e0e7ff'
              }}>
                <h2 style={{
                  marginBottom: '0.5rem',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#0032E6',
                  textAlign: 'center',
                  letterSpacing: '0.02em'
                }}>Export Data</h2>
                <p style={{
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  color: '#374151',
                  textAlign: 'center',
                  fontWeight: 500
                }}>Choose export format:</p>
                <button
                  style={{
                    padding: '0.7rem 1.2rem',
                    background: '#0032E6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '0.7rem',
                    width: '100%',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 8px rgba(0,50,230,0.12)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#0024b8'}
                  onMouseOut={e => e.currentTarget.style.background = '#0032E6'}
                  onClick={() => { setExportFormat('xlsx'); handleExport(); }}
                >
                  Excel (XLSX)
                </button>
                <button
                  style={{
                    padding: '0.7rem 1.2rem',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.12)',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#059669'}
                  onMouseOut={e => e.currentTarget.style.background = '#10b981'}
                  onClick={() => { setExportFormat('json'); handleExport(); }}
                >
                  JSON
                </button>
                <button
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '2rem',
                    color: '#5B7FFF',
                    cursor: 'pointer',
                    fontWeight: 700,
                    lineHeight: 1
                  }}
                  aria-label="Close export modal"
                  onClick={() => setShowExportModal(false)}
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-description">
              {isTeamManager ? "Managed Tasks" : "Total Tasks"}
            </div>
          </div>
        </div>

        {/* ✅ NEW: Show managed teams count for team-manager */}
        {isTeamManager && (
          <div className="stat-card">
            <div className="stat-icon">👔</div>
            <div className="stat-content">
              <div className="stat-value">{stats.managedTeamsCount}</div>
              <div className="stat-description">Managed Teams</div>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.teamCount}</div>
            <div className="stat-description">Team Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-description">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-description">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.rate}%</div>
            <div className="stat-description">Completion Rate</div>
          </div>
        </div>
      </div>

      <div className="recent-tasks-section">
        <h2 className="section-title">Recent Tasks</h2>
        {recentTasks.length > 0 ? (
          <div className="task-list">
            {recentTasks.map((task) => (
              <div key={task._id} className="task-item">
                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <div className="task-meta">
                    <span className={`task-status status-${task.status}`}>{task.status}</span>
                    <span className={`task-priority priority-${task.priority}`}>{task.priority}</span>
                    {/* ✅ NEW: Show if it's a team task */}
                    {task.isTeamTask && (
                      <span className="task-type-badge">👥 Team</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-tasks">No tasks yet</p>
        )}
      </div>
    </div>
  );
}