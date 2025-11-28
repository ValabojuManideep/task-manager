import React, { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import useAppStore from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
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
        <button className="view-all-btn" onClick={() => navigate("/tasks/team")}>
          View All Tasks
        </button>
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
