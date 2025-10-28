import React, { useState, useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import "./TaskBoard.css";

export default function TaskBoard() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [showForm, setShowForm] = useState(false);
  const { tasks } = useContext(TaskContext);

  return (
    <div className="taskboard-container">
      <div className="taskboard-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} tasks found</p>
        </div>
        <button className="new-task-btn" onClick={() => setShowForm(!showForm)}>
          <span>+</span>
          <span>New Task</span>
        </button>
      </div>

      {showForm && (
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
      </div>

      <TaskList statusFilter={statusFilter} priorityFilter={priorityFilter} />
    </div>
  );
}
