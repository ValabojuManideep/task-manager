import React, { useContext, useState, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./TaskForm.css";

export default function TaskForm({ onClose }) {
  const { addTask } = useContext(TaskContext);
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/auth/users");
      // Filter only users with role "user" (not admins)
      setUsers(data.filter(u => u.role === "user"));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    addTask({ ...form, createdBy: user.id });
    setForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "", assignedTo: "" });
    if (onClose) onClose();
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
        <label>Assign To</label>
        <select name="assignedTo" value={form.assignedTo} onChange={handleChange}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.username} ({u.email})
            </option>
          ))}
        </select>
      </div>

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
          type="date" 
          name="dueDate" 
          value={form.dueDate} 
          onChange={handleChange}
          min={today}
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
