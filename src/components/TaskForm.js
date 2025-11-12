import React, { useContext, useState, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { TeamContext } from "../context/TeamContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./TaskForm.css";

export default function TaskForm({ onClose }) {
  const { addTask } = useContext(TaskContext);
  const { teams } = useContext(TeamContext);
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [assignmentType, setAssignmentType] = useState("user");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
    assignedToTeam: "",
    recurrencePattern: "none",
    recurrenceEndDate: ""
  });

  const today = new Date().toISOString().split('T')[0];
  const nowForDateTimeLocal = new Date().toISOString().slice(0,16); // YYYY-MM-DDTHH:mm

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/auth/users");
      setUsers(data.filter(u => u.role === "user"));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent dueDate from being after recurrenceEndDate
    if (
      form.recurrenceEndDate &&
      form.dueDate &&
      new Date(form.dueDate) > new Date(form.recurrenceEndDate)
    ) {
      alert("Due date cannot be after recurrence end date.");
      return;
    }

    const taskData = {
      ...form,
      createdBy: user.id,
      isTeamTask: assignmentType === "team",
      isRecurrent: form.recurrencePattern && form.recurrencePattern !== "none" ? true : false
    };

    // Convert datetime-local strings to ISO (so backend/Mongo stores full timestamp)
    if (taskData.dueDate) {
      try {
        taskData.dueDate = new Date(taskData.dueDate).toISOString();
      } catch (e) {
        console.warn('Invalid dueDate format', taskData.dueDate);
      }
    }
    if (taskData.recurrenceEndDate) {
      try {
        taskData.recurrenceEndDate = new Date(taskData.recurrenceEndDate).toISOString();
      } catch (e) {
        console.warn('Invalid recurrenceEndDate format', taskData.recurrenceEndDate);
      }
    }
    // Debug: log taskData before sending
    console.log('Submitting taskData:', taskData);

    if (assignmentType === "team") {
      delete taskData.assignedTo;
    } else {
      delete taskData.assignedToTeam;
    }

    await addTask(taskData);
    setForm({ 
      title: "", 
      description: "", 
      status: "todo", 
      priority: "medium", 
      dueDate: "", 
      assignedTo: "",
      assignedToTeam: "",
      recurrencePattern: "none",
      recurrenceEndDate: ""
    });
    if (onClose) onClose();
  };

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter teams based on search
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    team.members?.some(member => 
      member.username.toLowerCase().includes(teamSearchTerm.toLowerCase())
    )
  );

  // Get selected user/team names for display
  const getSelectedUserName = () => {
    if (!form.assignedTo) return "Select User";
    const user = users.find(u => u._id === form.assignedTo);
    return user ? user.username : "Select User";
  };

  const getSelectedTeamName = () => {
    if (!form.assignedToTeam) return "Select Team";
    const team = teams.find(t => t._id === form.assignedToTeam);
    return team ? team.name : "Select Team";
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Create New Task</h3>

      <div className="form-group">
        <label>Task Title</label>
        <input
          name="title"
          placeholder="Enter task title"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          placeholder="Enter task description"
          value={form.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Recurrent Task</label>
        <select
          name="recurrencePattern"
          value={form.recurrencePattern}
          onChange={e => setForm({ ...form, recurrencePattern: e.target.value })}
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="fortnight">Fortnight</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {form.recurrencePattern !== "none" && (
        <div className="form-group">
          <label>Recurrent Until (End Date)</label>
            <input
              type="datetime-local"
              name="recurrenceEndDate"
              min={nowForDateTimeLocal}
              value={form.recurrenceEndDate}
              onChange={handleChange}
              required={form.recurrencePattern !== "none"}
            />
          </div>
      )}

      <div className="form-group">
        <label>Assignment Type</label>
        <div className="assignment-type-toggle">
          <button
            type="button"
            className={`toggle-btn ${assignmentType === "user" ? "active" : ""}`}
            onClick={() => {
              setAssignmentType("user");
              setShowTeamDropdown(false);
            }}
          >
            👤 Individual User
          </button>
          <button
            type="button"
            className={`toggle-btn ${assignmentType === "team" ? "active" : ""}`}
            onClick={() => {
              setAssignmentType("team");
              setShowUserDropdown(false);
            }}
          >
            👥 Team
          </button>
        </div>
      </div>

      {assignmentType === "user" ? (
        <div className="form-group">
          <label>Assign To User</label>
          <div className="custom-dropdown-wrapper">
            <div 
              className="custom-dropdown-header"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <span>{getSelectedUserName()}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showUserDropdown && (
              <div className="custom-dropdown-container">
                <input
                  type="text"
                  className="dropdown-search"
                  placeholder="🔍 Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="custom-dropdown-list">
                  <div
                    className={`dropdown-item ${form.assignedTo === "" ? "selected" : ""}`}
                    onClick={() => {
                      setForm({ ...form, assignedTo: "" });
                      setShowUserDropdown(false);
                      setUserSearchTerm("");
                    }}
                  >
                    Unassigned
                  </div>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <div
                        key={u._id}
                        className={`dropdown-item ${form.assignedTo === u._id ? "selected" : ""}`}
                        onClick={() => {
                          setForm({ ...form, assignedTo: u._id });
                          setShowUserDropdown(false);
                          setUserSearchTerm("");
                        }}
                      >
                        <div className="dropdown-item-main">{u.username}</div>
                        <div className="dropdown-item-sub">{u.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-no-results">No users found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label>Assign To Team</label>
          <div className="custom-dropdown-wrapper">
            <div 
              className="custom-dropdown-header"
              onClick={() => setShowTeamDropdown(!showTeamDropdown)}
            >
              <span>{getSelectedTeamName()}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showTeamDropdown && (
              <div className="custom-dropdown-container">
                <input
                  type="text"
                  className="dropdown-search"
                  placeholder="🔍 Search teams..."
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="custom-dropdown-list">
                  <div
                    className={`dropdown-item ${form.assignedToTeam === "" ? "selected" : ""}`}
                    onClick={() => {
                      setForm({ ...form, assignedToTeam: "" });
                      setShowTeamDropdown(false);
                      setTeamSearchTerm("");
                    }}
                  >
                    No Team
                  </div>
                  {filteredTeams.length > 0 ? (
                    filteredTeams.map((team) => (
                      <div
                        key={team._id}
                        className={`dropdown-item ${form.assignedToTeam === team._id ? "selected" : ""}`}
                        onClick={() => {
                          setForm({ ...form, assignedToTeam: team._id });
                          setShowTeamDropdown(false);
                          setTeamSearchTerm("");
                        }}
                      >
                        <div className="dropdown-item-main">{team.name}</div>
                        <div className="dropdown-item-sub">
                          {team.members?.length || 0} members
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-no-results">No teams found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Due Date</label>
        <input 
          type="datetime-local" 
          name="dueDate" 
          value={form.dueDate} 
          onChange={handleChange}
          min={nowForDateTimeLocal}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          Add Task
        </button>
      </div>
    </form>
  );
}
