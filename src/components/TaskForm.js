import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import useAppStore from "../store/useAppStore";
import "./TaskForm.css";

export default function TaskForm({ onClose }) {
  const teams = useAppStore((s) => s.teams);
  const addTask = async (task) => {
    try {
      await axios.post("http://localhost:5000/api/tasks", task);
      const { data } = await axios.get("http://localhost:5000/api/tasks");
      useAppStore.setState({ tasks: data, allTasks: data });
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };
  const { user } = useAuth();
  const users = useAppStore((s) => s.taskForm_users);
  const setUsers = useAppStore((s) => s.setTaskForm_users);
  const assignmentType = useAppStore((s) => s.taskForm_assignmentType);
  const setAssignmentType = useAppStore((s) => s.setTaskForm_assignmentType);
  const userSearchTerm = useAppStore((s) => s.taskForm_userSearchTerm);
  const setUserSearchTerm = useAppStore((s) => s.setTaskForm_userSearchTerm);
  const teamSearchTerm = useAppStore((s) => s.taskForm_teamSearchTerm);
  const setTeamSearchTerm = useAppStore((s) => s.setTaskForm_teamSearchTerm);
  const showUserDropdown = useAppStore((s) => s.taskForm_showUserDropdown);
  const setShowUserDropdown = useAppStore((s) => s.setTaskForm_showUserDropdown);
  const showTeamDropdown = useAppStore((s) => s.taskForm_showTeamDropdown);
  const setShowTeamDropdown = useAppStore((s) => s.setTaskForm_showTeamDropdown);

  // FILE UPLOAD STATE
  const files = useAppStore((s) => s.taskForm_files);
  const setFiles = useAppStore((s) => s.setTaskForm_files);
  const fileError = useAppStore((s) => s.taskForm_fileError);
  const setFileError = useAppStore((s) => s.setTaskForm_fileError);
  const uploading = useAppStore((s) => s.taskForm_uploading);
  const setUploading = useAppStore((s) => s.setTaskForm_uploading);

  const form = useAppStore((s) => s.taskForm_form);
  const setForm = useAppStore((s) => s.setTaskForm_form);
  const isPrivate = useAppStore((s) => s.taskForm_isPrivate);
  const setIsPrivate = useAppStore((s) => s.setTaskForm_isPrivate);
  const privateKey = useAppStore((s) => s.taskForm_privateKey);
  const setPrivateKey = useAppStore((s) => s.setTaskForm_privateKey);
  const privateKeyError = useAppStore((s) => s.taskForm_privateKeyError);
  const setPrivateKeyError = useAppStore((s) => s.setTaskForm_privateKeyError);

  const today = new Date().toISOString().split('T')[0];
  const nowForDateTimeLocal = new Date().toISOString().slice(0,16);

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

  // FILE UPLOAD HANDLERS
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFileError("");
    
    // Validate file count (max 5)
    if (selectedFiles.length > 5) {
      setFileError("Maximum 5 files allowed");
      return;
    }
    
    // Validate file size (max 5MB per file)
    const maxSize = 5 * 1024 * 1024;
    const validFiles = [];
    
    for (let file of selectedFiles) {
      if (file.size > maxSize) {
        setFileError(`${file.name} exceeds 5MB limit`);
        continue;
      }
      validFiles.push(file);
    }
    
    setFiles(validFiles);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    if (
      form.recurrenceEndDate &&
      form.dueDate &&
      new Date(form.dueDate) > new Date(form.recurrenceEndDate)
    ) {
      alert("Due date cannot be after recurrence end date.");
      setUploading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all form fields
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('status', form.status);
      formData.append('priority', form.priority);
      formData.append('createdBy', user.id);
      formData.append('creatorName', user.username);
      formData.append('isTeamTask', assignmentType === "team");
      formData.append('isRecurrent', form.recurrencePattern && form.recurrencePattern !== "none");
      formData.append('isPrivate', isPrivate);
      
      if (form.dueDate) {
        formData.append('dueDate', new Date(form.dueDate).toISOString());
      }
      
      if (form.recurrencePattern && form.recurrencePattern !== "none") {
        formData.append('recurrencePattern', form.recurrencePattern);
        if (form.recurrenceEndDate) {
          formData.append('recurrenceEndDate', new Date(form.recurrenceEndDate).toISOString());
        }
      }

      if (assignmentType === "team") {
        if (form.assignedToTeam) {
          formData.append('assignedToTeam', form.assignedToTeam);
        }
      } else {
        if (form.assignedTo) {
          formData.append('assignedTo', form.assignedTo);
        }
      }

      if (isPrivate) {
        if (!privateKey) {
          setPrivateKeyError("Enter security key.");
          setUploading(false);
          return;
        }
        setPrivateKeyError("");
        formData.append('privateKey', privateKey);
      }

      // Append files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Send to backend
      const response = await axios.post('http://localhost:5000/api/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.error && isPrivate) {
        setPrivateKeyError("Invalid security key.");
        setUploading(false);
        return;
      }

      // Reset form
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
      setFiles([]);
      setFileError("");
      setIsPrivate(false);
      setPrivateKey("");
      setPrivateKeyError("");
      
      // Refresh tasks in context
      await addTask(null); // Trigger refresh
      
      if (onClose) onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task: " + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    team.members?.some(member => 
      member.username.toLowerCase().includes(teamSearchTerm.toLowerCase())
    )
  );

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

      {/* FILE UPLOAD SECTION */}
      <div className="form-group">
        <label>📎 Attachments</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          style={{ marginTop: "8px" }}
        />
        <p style={{ fontSize: "0.85em", color: "#666", marginTop: "4px" }}>
          Max 5MB per file, up to 5 files. Formats: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF
        </p>
        {fileError && (
          <div style={{ color: "red", fontSize: "0.9em", marginTop: "5px" }}>
            {fileError}
          </div>
        )}
      </div>

      {/* SELECTED FILES PREVIEW */}
      {files.length > 0 && (
        <div style={{ 
          background: "#f5f5f5", 
          padding: "12px", 
          borderRadius: "6px", 
          marginBottom: "15px" 
        }}>
          <p style={{ fontWeight: "600", marginBottom: "8px", fontSize: "0.95em" }}>
            Selected Files ({files.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {files.map((file, index) => (
              <div 
                key={index} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  background: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "1.2em" }}>{getFileIcon(file)}</span>
                  <span style={{ 
                    fontSize: "0.9em", 
                    color: "#333",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: "0.75em", color: "#999", whiteSpace: "nowrap" }}>
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#e53e3e",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "0.9em"
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={e => setIsPrivate(e.target.checked)}
          />
          Sensitive Task
        </label>
        {isPrivate && (
          <div style={{ marginTop: "8px" }}>
            <input
              type="password"
              placeholder="Enter security key"
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
              required
            />
            {privateKeyError && (
              <div style={{color: "red", fontSize: "0.93em", marginTop: "5px"}}>{privateKeyError}</div>
            )}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onClose} disabled={uploading}>
          Cancel
        </button>
        <button type="submit" className="submit-btn" disabled={uploading}>
          {uploading ? "Creating..." : "Add Task"}
        </button>
      </div>
    </form>
  );
}