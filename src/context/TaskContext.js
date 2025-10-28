import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const TaskContext = createContext();

export const TaskProvider = ({ children, userId }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await axios.get(`http://localhost:5000/api/tasks/${userId}`);
    setTasks(res.data);
  };

  const addTask = async (task) => {
    const res = await axios.post("http://localhost:5000/api/tasks", { ...task, userId });
    setTasks([...tasks, res.data]);
  };

  const updateTask = async (id, updates) => {
    const res = await axios.put(`http://localhost:5000/api/tasks/${id}`, updates);
    setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
  };

  const deleteTask = async (id) => {
    await axios.delete(`http://localhost:5000/api/tasks/${id}`);
    setTasks(tasks.filter((t) => t._id !== id));
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};
