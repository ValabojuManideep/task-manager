import React, { useState, useContext, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import axios from "axios";
import "./TaskBoard.css";

export default function TaskBoard() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [userFilter, setUserFilter] = useState("All Users");
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const { tasks, allTasks } = useContext(TaskContext);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/auth/users");
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Filter tasks based on role and user filter
  const getDisplayTasks = () => {
    let filtered = isAdmin 
      ? allTasks 
      : allTasks.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id);

    // Apply user filter for admin
    if (isAdmin && userFilter !== "All Users") {
      filtered = filtered.filter(t => {
        const assignedId = t.assignedTo?._id || t.assignedTo;
        return assignedId === userFilter;
      });
    }

    return filtered;
  };

  const displayTasks = getDisplayTasks();

  return (
    <div className="taskboard-container">
      <div className="taskboard-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            {isAdmin ? `${displayTasks.length} tasks` : `${displayTasks.length} tasks assigned to you`}
          </p>
        </div>
        {isAdmin && (
          <button className="new-task-btn" onClick={() => setShowForm(!showForm)}>
            <span>+</span>
            <span>New Task</span>
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="task-form-wrapper">
          <TaskForm onClose={() => setShowForm(false)} />
        </div>
      )}

      <div className="filters-row">
        <div className="filter-group">
          <button
            className={`filter-btn ${statusFilter === "All" ? "active" : ""}`}
            onClick={() => setStatusFilter("All")}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === "todo" ? "active" : ""}`}
            onClick={() => setStatusFilter("todo")}
          >
            To Do
          </button>
          <button
            className={`filter-btn ${statusFilter === "in_progress" ? "active" : ""}`}
            onClick={() => setStatusFilter("in_progress")}
          >
            In Progress
          </button>
          <button
            className={`filter-btn ${statusFilter === "done" ? "active" : ""}`}
            onClick={() => setStatusFilter("done")}
          >
            Done
          </button>
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${priorityFilter === "All Priority" ? "active" : ""}`}
            onClick={() => setPriorityFilter("All Priority")}
          >
            All Priority
          </button>
          <button
            className={`filter-btn ${priorityFilter === "high" ? "active" : ""}`}
            onClick={() => setPriorityFilter("high")}
          >
            High
          </button>
          <button
            className={`filter-btn ${priorityFilter === "medium" ? "active" : ""}`}
            onClick={() => setPriorityFilter("medium")}
          >
            Medium
          </button>
          <button
            className={`filter-btn ${priorityFilter === "low" ? "active" : ""}`}
            onClick={() => setPriorityFilter("low")}
          >
            Low
          </button>
        </div>

        {isAdmin && users.length > 0 && (
          <div className="filter-group user-filter">
            <select 
              className="user-filter-select"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="All Users">All Users</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <TaskList 
        statusFilter={statusFilter} 
        priorityFilter={priorityFilter}
        displayTasks={displayTasks}
      />
    </div>
  );
}
