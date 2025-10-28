import { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";

export default function TaskForm() {
  const { addTask } = useContext(TaskContext);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", dueDate: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    addTask(form);
    setForm({ title: "", description: "", priority: "medium", dueDate: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Task title" value={form.title} onChange={handleChange} />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <select name="priority" value={form.priority} onChange={handleChange}>
        <option>low</option>
        <option>medium</option>
        <option>high</option>
      </select>
      <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
      <button type="submit">Add Task</button>
    </form>
  );
}
