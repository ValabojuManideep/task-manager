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
  const [showPrivateSection, setShowPrivateSection] = useState(false);
  const [securityKey, setSecurityKey] = useState("");
  const [privateKeyEntered, setPrivateKeyEntered] = useState(false);

  const { tasks, allTasks, privateTasks, fetchPrivateTasks } = useContext(TaskContext);

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

  // Private tasks
  const handleShowPrivate = async () => {
    if (!securityKey) {
      alert("Enter security key.");
      return;
    }
    const data = await fetchPrivateTasks(securityKey);
    if (data && data.length > 0) {
      setPrivateKeyEntered(true);
    } else {
      setPrivateKeyEntered(false);
      alert("Invalid key or no sensitive tasks.");
    }
  };

  // Filter tasks based on type and role
  const getDisplayTasks = () => {
    let filtered;
    const currentUserId = user?.id || user?._id;

    if (taskType === "team") {
      if (isAdmin) {
        filtered = allTasks.filter(t => t.isTeamTask === true && !t.isPrivate);
      } else {
        filtered = allTasks.filter(t => {
          if (!t.isTeamTask || t.isPrivate) return false;
          if (!t.assignedToTeam) return false;
          const teamMembers = t.assignedToTeam.members || [];
          return teamMembers.some(member => {
            const memberId = member._id || member;
            return String(memberId) === String(currentUserId);
          });
        });
      }
    } else {
      if (isAdmin) {
        filtered = allTasks.filter(t => t.isTeamTask === false && !t.isPrivate);
      } else {
        filtered = allTasks.filter(t => {
          if (t.isTeamTask || t.isPrivate) return false;
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
          <button
            style={{ marginLeft: "10px" }}
            className="filter-btn"
            onClick={() => setShowPrivateSection(!showPrivateSection)}
          >
            Sensitive Tasks
          </button>
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

      {showPrivateSection && (
        <div style={{ margin: "18px 0", padding: "16px", border: "1px solid #cfcfcf", borderRadius: "6px", background: "#f9f9fd" }}>
          <h2>Sensitive Tasks</h2>
          {!privateKeyEntered && (
            <div>
              <input
                type="password"
                value={securityKey}
                onChange={e => setSecurityKey(e.target.value)}
                placeholder="Enter security key"
                style={{ marginRight: "12px" }}
              />
              <button onClick={handleShowPrivate} className="filter-btn">Access</button>
            </div>
          )}
          {privateKeyEntered && (
            <TaskList
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              displayTasks={privateTasks}
            />
          )}
        </div>
      )}

      <TaskList 
        statusFilter={statusFilter} 
        priorityFilter={priorityFilter}
        displayTasks={displayTasks}
      />
    </div>
  );
}
