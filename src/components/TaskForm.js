import { useState } from "react";
import { useTasks } from "../context/TaskContext";

const TaskForm = () => {
  const { addTask } = useTasks();
  const [task, setTask] = useState({
    title: "",
    status: "To Do",
    priority: "Medium",
    dueDate: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title) return;
    addTask(task);
    setTask({ title: "", status: "To Do", priority: "Medium", dueDate: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} placeholder="Task title" />
      <select value={task.status} onChange={(e) => setTask({ ...task, status: e.target.value })}>
        <option>To Do</option>
        <option>In Progress</option>
        <option>Done</option>
      </select>
      <select value={task.priority} onChange={(e) => setTask({ ...task, priority: e.target.value })}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
      <input type="date" value={task.dueDate} onChange={(e) => setTask({ ...task, dueDate: e.target.value })} />
      <button type="submit">Add Task</button>
    </form>
  );
};

export default TaskForm;
