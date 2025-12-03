import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import axios from "axios";
import useAppStore from "../store/useAppStore";
import "./TaskBoard.css";

export default function TaskBoard({ taskType = "team" }) {
  // Search bar state
  
  
  
  const taskSearchTerm = useAppStore((s) => s.taskBoard_taskSearchTerm);
  const setTaskSearchTerm = useAppStore((s) => s.setTaskBoard_taskSearchTerm);
  const { user } = useAuth();
  const statusFilter = useAppStore((s) => s.taskBoard_statusFilter);
  const setStatusFilter = useAppStore((s) => s.setTaskBoard_statusFilter);
  const priorityFilter = useAppStore((s) => s.taskBoard_priorityFilter);
  
  const viewMode = useAppStore((s) => s.taskList_viewMode);
  const setViewMode = useAppStore((s) => s.setTaskList_viewMode);
  
  const setPriorityFilter = useAppStore((s) => s.setTaskBoard_priorityFilter);
  const userFilter = useAppStore((s) => s.taskBoard_userFilter);
  const setUserFilter = useAppStore((s) => s.setTaskBoard_userFilter);
  const showForm = useAppStore((s) => s.taskBoard_showForm);
  const setShowForm = useAppStore((s) => s.setTaskBoard_showForm);
  const users = useAppStore((s) => s.taskBoard_users);
  const setUsers = useAppStore((s) => s.setTaskBoard_users);
  const showPrivateSection = useAppStore((s) => s.taskBoard_showPrivateSection);
  const setShowPrivateSection = useAppStore((s) => s.setTaskBoard_showPrivateSection);
  const securityKey = useAppStore((s) => s.taskBoard_securityKey);
  const setSecurityKey = useAppStore((s) => s.setTaskBoard_securityKey);
  const privateKeyEntered = useAppStore((s) => s.taskBoard_privateKeyEntered);
  const setPrivateKeyEntered = useAppStore((s) => s.setTaskBoard_privateKeyEntered);

  const tasks = useAppStore((s) => s.tasks);
  const allTasks = useAppStore((s) => s.allTasks);
  const privateTasks = useAppStore((s) => s.privateTasks);
  const fetchPrivateTasks = async (key) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/tasks/private", {
        headers: { "x-private-key": key }
      });
      useAppStore.setState({ privateTasks: data });
      return data;
    } catch (err) {
      console.error("Error fetching private tasks:", err);
      useAppStore.setState({ privateTasks: [] });
      return [];
    }
  };

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Close form when switching between user/team tasks
  useEffect(() => {
    setShowForm(false);
  }, [taskType]);

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

    // Apply search filter (task name or description)
    if (taskSearchTerm.trim()) {
      const term = taskSearchTerm.trim().toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
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
        <div
          style={{
            display: "flex",
            gap: "0.8rem",
            alignItems: "center",
            flexWrap: "nowrap",
            width: "100%",
            marginTop: "0.5rem",
            overflowX: "auto"
          }}
        >
          <div className="filter-group" style={{ flexShrink: 0 }}>
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

          <div className="filter-group" style={{ flexShrink: 0 }}>
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
            <div className="filter-group user-filter" style={{ flexShrink: 0 }}>
              <select 
                className="user-filter-select"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{ minWidth: "120px", height: "32px", fontSize: "0.85em" }}
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

          {/* Search bar beside filters */}
          <div style={{ position: "relative", minWidth: "140px", maxWidth: "240px", flex: 1, flexShrink: 1 }}>
            <input
              type="text"
              className="task-search-input"
              placeholder="Search..."
              value={taskSearchTerm}
              onChange={e => setTaskSearchTerm(e.target.value)}
              style={{
                padding: "6px 36px 6px 12px",
                borderRadius: "8px",
                border: "1.5px solid #222",
                width: "100%",
                fontSize: "0.9em",
                marginBottom: "4px"
              }}
            />
            <span style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888",
              fontSize: "1.3em",
              pointerEvents: "none"
            }}>🔍</span>
          </div>
        </div>
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
