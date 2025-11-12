import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [privateTasks, setPrivateTasks] = useState([]);
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

  // Fetch private tasks using key
  const fetchPrivateTasks = async (key) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/tasks/private", {
        headers: { "x-private-key": key }
      });
      setPrivateTasks(data);
      return data;
    } catch (err) {
      console.error("Error fetching private tasks:", err);
      setPrivateTasks([]);
      return [];
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (task) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/tasks", task);
      await fetchTasks();
      return data;
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/tasks/${id}`, updates);
      await fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        data: { username: user?.username || "Admin" }
      });
      await fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      allTasks,
      privateTasks,
      addTask,
      updateTask,
      deleteTask,
      fetchTasks,
      fetchPrivateTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
};
