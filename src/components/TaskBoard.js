import React, { useState, useContext, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import axios from "axios";
import "./TaskBoard.css";

export default function TaskBoard({ taskType = "team" }) {
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

  // Filter tasks based on type and role
  const getDisplayTasks = () => {
    let filtered;
    const currentUserId = user?.id || user?._id;

    if (taskType === "team") {
      // Show only team tasks
      if (isAdmin) {
        // Admin sees all team tasks
        filtered = allTasks.filter(t => t.isTeamTask === true);
      } else {
        // Regular users see team tasks where they are a member
        filtered = allTasks.filter(t => {
          if (!t.isTeamTask) return false;
          
          // Check if user is in the team
          if (!t.assignedToTeam) return false;
          
          const teamMembers = t.assignedToTeam.members || [];
          return teamMembers.some(member => {
            const memberId = member._id || member;
            return String(memberId) === String(currentUserId);
          });
        });
      }
    } else {
      // Show only user tasks
      if (isAdmin) {
        // Admin sees all user tasks
        filtered = allTasks.filter(t => t.isTeamTask === false);
      } else {
        // Regular users see their own tasks
        filtered = allTasks.filter(t => {
          if (t.isTeamTask) return false;
          
          const assignedId = t.assignedTo?._id || t.assignedTo;
          return String(assignedId) === String(currentUserId);
        });
      }
    }

    // Apply user filter for admin (only for user tasks)
    if (isAdmin && userFilter !== "All Users" && taskType === "user") {
      filtered = filtered.filter(t => {
        const assignedId = t.assignedTo?._id || t.assignedTo;
        return String(assignedId) === String(userFilter);
      });
    }

    return filtered;
  };

  const displayTasks = getDisplayTasks();

  return (
    <div className="taskboard-container">
      <div className="taskboard-header">
        <div>
          <h1 className="page-title">
            {taskType === "team" ? "Team Tasks" : "User Tasks"}
          </h1>
          <p className="page-subtitle">
            {isAdmin 
              ? `${displayTasks.length} ${taskType} tasks` 
              : `${displayTasks.length} ${taskType} task${displayTasks.length !== 1 ? 's' : ''} assigned to you`}
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
          <TaskForm onClose={() => setShowForm(false)} taskType={taskType} />
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

        {isAdmin && users.length > 0 && taskType === "user" && (
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
