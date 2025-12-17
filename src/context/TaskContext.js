import { useEffect } from "react";
import axios from "axios";
import useAppStore from "../store/useAppStore";

export const TaskProvider = ({ children }) => {
  const tasks = useAppStore((s) => s.tasks);
  const setTasks = useAppStore((s) => s.setTasks);
  const allTasks = useAppStore((s) => s.allTasks);
  const setAllTasks = useAppStore((s) => s.setAllTasks);
  const privateTasks = useAppStore((s) => s.privateTasks);
  const setPrivateTasks = useAppStore((s) => s.setPrivateTasks);
  const user = useAppStore((s) => s.user);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("/api/tasks");
      setAllTasks(data);
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  // Fetch private tasks using key
  const fetchPrivateTasks = async (key) => {
    try {
      const { data } = await axios.get("/api/tasks/private", {
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
      const { data } = await axios.post("/api/tasks", task);
      await fetchTasks();
      return data;
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const { data } = await axios.put(`/api/tasks/${id}`, updates);
      await fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`, {
        data: { username: user?.username || "Admin" }
      });
      await fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return children;
};
