import React, { useContext, useMemo } from "react";
import { TaskContext } from "../context/TaskContext";
import { TeamContext } from "../context/TeamContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const { allTasks } = useContext(TaskContext);
  const { teams } = useContext(TeamContext);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  // Filter tasks based on role
  const userTasks = useMemo(() => {
    if (isAdmin) return allTasks;
    return allTasks.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id);
  }, [allTasks, user, isAdmin]);

  // Get team tasks for the user
  const teamTasks = useMemo(() => {
    if (isAdmin) {
      // Admin sees all team tasks
      return allTasks.filter(t => t.isTeamTask === true);
    } else {
      // Regular users see team tasks where they are a member
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
  }, [allTasks, user, isAdmin]);

  const stats = useMemo(() => {
    const total = userTasks.length;
    const inProgress = userTasks.filter((t) => t.status === "in_progress").length;
    const completed = userTasks.filter((t) => t.status === "done").length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const teamCount = teamTasks.length;
    return { total, inProgress, completed, rate, teamCount };
  }, [userTasks, teamTasks]);

  const recentTasks = useMemo(() => {
    return [...userTasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [userTasks]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {isAdmin ? "Overview of all tasks and progress" : "Your tasks and progress"}
          </p>
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
            <div className="stat-description">Total Tasks</div>
          </div>
        </div>

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
