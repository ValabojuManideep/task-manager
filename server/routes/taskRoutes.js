import express from "express";
import Task from "../models/Task.js";
import { logActivity } from "./activityRoutes.js";

const router = express.Router();

// Get all tasks
router.get("/", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// Add a new task
router.post("/", async (req, res) => {
  const newTask = new Task(req.body);
  await newTask.save();
  await logActivity("created", newTask.title, req.body.userId || "User");
  res.status(201).json(newTask);
});

// Update task
router.put("/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  const oldStatus = task?.status;
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  
  if (oldStatus && updated.status !== oldStatus) {
    await logActivity("updated", updated.title, req.body.userId || "User", `Status changed from ${oldStatus} to ${updated.status}`);
  } else {
    await logActivity("updated", updated.title, req.body.userId || "User");
  }
  
  res.json(updated);
});

// Delete task
router.delete("/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  await Task.findByIdAndDelete(req.params.id);
  await logActivity("deleted", task?.title || "Task", req.body.userId || "User");
  res.json({ message: "Task deleted" });
});

export default router;
