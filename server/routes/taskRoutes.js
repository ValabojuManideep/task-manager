import express from "express";
import Task from "../models/Task.js";
import { logActivity } from "./activityRoutes.js";

const router = express.Router();

// Get all tasks
router.get("/", async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "username email")
    .populate({
      path: "assignedToTeam",
      populate: { path: "members", select: "username email" }
    });
  res.json(tasks);
});

// Add a new task
router.post("/", async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    
    // Populate both assignedTo and assignedToTeam
    await newTask.populate("assignedTo", "username email");
    await newTask.populate({
      path: "assignedToTeam",
      populate: { path: "members", select: "username email" }
    });
    
    const creatorName = req.body.creatorName || "Admin";
    const assignedInfo = req.body.isTeamTask 
      ? "Assigned to team" 
      : req.body.assignedTo ? "Assigned to user" : "";
    
    await logActivity("created", newTask.title, creatorName, assignedInfo);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const oldStatus = task.status;
    
    const username = req.body.userId || "User";
    const { userId, ...updateData } = req.body;
    
    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("assignedTo", "username email")
      .populate({
        path: "assignedToTeam",
        populate: { path: "members", select: "username email" }
      });
    
    if (oldStatus && updated.status !== oldStatus) {
      await logActivity("updated", updated.title, username, `Status changed from ${oldStatus} to ${updated.status}`);
    }
    
    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const taskTitle = task.title;
    
    await Task.findByIdAndDelete(req.params.id);
    
    const adminUsername = req.body.username || "Admin";
    await logActivity("deleted", taskTitle, adminUsername, "Task deleted");
    
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add comment to task
router.post("/:id/comment", async (req, res) => {
  try {
    const { userId, username, userRole, text } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.comments.push({ 
      userId, 
      username, 
      userRole, 
      text,
      createdAt: new Date()
    });
    
    await task.save();
    await logActivity("commented", task.title, username, "Added comment");
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit comment
router.put("/:taskId/comment/:commentId", async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await task.save();
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete("/:taskId/comment/:commentId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.comments = task.comments.filter(c => c._id.toString() !== req.params.commentId);
    await task.save();
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
