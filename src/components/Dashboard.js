import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TaskContext } from "../context/TaskContext";
import { format } from "date-fns";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks = [] } = useContext(TaskContext);

  const { total, inProgress, done, rate, recent } = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const done = tasks.filter(t => t.status === "done").length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    const recent = [...tasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
    return { total, inProgress, done, rate, recent };
  }, [tasks]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "todo": return "To Do";
      case "in_progress": return "In Progress";
      case "done": return "Completed";
      default: return status;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your tasks and progress</p>
        </div>
        <button className="view-all-btn" onClick={() => navigate("/tasks")}>
          View All Tasks
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Tasks</span>
            <span className="stat-icon">▦</span>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-description">All tasks in system</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">In Progress</span>
            <span className="stat-icon">⏱</span>
          </div>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-description">Currently active</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Completed</span>
            <span className="stat-icon">☑</span>
          </div>
          <div className="stat-value">{done}</div>
          <div className="stat-description">Tasks finished</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Completion Rate</span>
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-value">{rate}%</div>
          <div className="stat-description">Overall progress</div>
        </div>
      </div>

      <div className="recent-tasks-section">
        <h2 className="section-title">Recent Tasks</h2>
        {recent.length === 0 ? (
          <div className="empty-state">
            <p>No tasks available</p>
          </div>
        ) : (
          <div className="tasks-list">
            {recent.map((task) => (
              <div key={task._id || task.id} className="task-item">
                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <div className="task-meta">
                    Status: {getStatusLabel(task.status)} | Priority:{" "}
                    <span style={{ color: getPriorityColor(task.priority), fontWeight: "600" }}>
                      {task.priority}
                    </span>
                    {task.dueDate && <> | Due: {format(new Date(task.dueDate), "MMM d")}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
