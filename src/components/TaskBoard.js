import { useState } from "react";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

const TaskBoard = () => {
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <div>
      <h2>Tasks</h2>
      <TaskForm />
      <select onChange={(e) => setStatusFilter(e.target.value)}>
        <option>All</option>
        <option>To Do</option>
        <option>In Progress</option>
        <option>Done</option>
      </select>
      <TaskList filter={statusFilter} />
    </div>
  );
};

export default TaskBoard;
