import { createContext, useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";

export const TaskContext = createContext();
export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children, userId }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/tasks`);
      setTasks(data);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    }
  }, []);

  const addTask = async (task) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/tasks", { ...task, userId });
      setTasks(prev => [...prev, data]);
    } catch (err) {
      console.error("Add task error:", err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/tasks/${id}`, updates);
      setTasks(prev => prev.map(t => ((t._id || t.id) === id ? data : t)));
    } catch (err) {
      console.error("Update task error:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};
