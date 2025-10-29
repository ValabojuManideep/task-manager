import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const { user } = useAuth();

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/tasks");
      setAllTasks(data);
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (task) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/tasks", task);
      setTasks([...tasks, data]);
      setAllTasks([...allTasks, data]);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/tasks/${id}`, updates);
      setTasks(tasks.map((t) => (t._id === id ? data : t)));
      setAllTasks(allTasks.map((t) => (t._id === id ? data : t)));
      await fetchTasks(); // Refresh to ensure consistency
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        data: { username: user?.username || "Admin" }
      });
      setTasks(tasks.filter((t) => t._id !== id));
      setAllTasks(allTasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, allTasks, addTask, updateTask, deleteTask, fetchTasks }}>
      {children}
    </TaskContext.Provider>
  );
};
