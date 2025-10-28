import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import "./TaskForm.css";

export default function TaskForm({ onClose }) {
  const { addTask } = useContext(TaskContext);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    addTask(form);
    setForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });
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
        <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
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
