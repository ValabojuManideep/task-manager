import React, { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import { format } from "date-fns";
import "./TaskList.css";

export default function TaskList({ statusFilter, priorityFilter }) {
  const { tasks, updateTask, deleteTask } = useContext(TaskContext);

  const filtered = tasks.filter((t) => {
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All Priority" || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="empty-tasks">
        <div className="empty-icon">📋</div>
        <h3>No tasks found</h3>
        <p>Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {filtered.map((task) => {
        const id = task._id || task.id;
        return (
          <div key={id} className="task-card">
            <div className="task-card-header">
              <h3 className="task-card-title">{task.title}</h3>
              <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                {task.priority}
              </span>
            </div>
            {task.description && <p className="task-description">{task.description}</p>}
            <div className="task-card-footer">
              <span className="task-status-badge">{task.status}</span>
              {task.dueDate && (
                <span className="task-due">Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
              )}
            </div>
            <div className="task-actions">
              <button className="task-action-btn done-btn" onClick={() => updateTask(id, { status: "done" })}>
                ✓ Mark Done
              </button>
              <button className="task-action-btn delete-btn" onClick={() => deleteTask(id)}>
                🗑 Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
