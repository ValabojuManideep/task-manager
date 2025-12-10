import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import { logActivity } from "./activityRoutes.js";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();
const PRIVATE_TASK_KEY = process.env.PRIVATE_TASK_KEY;

const router = express.Router();

// ✅ Configure multer for file uploads
const storage = multer.memoryStorage();
const fileUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // max 5 files
  }
});

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "username email")
      .populate({
        path: "assignedToTeam",
        populate: { path: "members", select: "username email" }
      });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get private tasks (requires security key)
router.get("/private", async (req, res) => {
  const key = req.headers["x-private-key"];
  if (!key || key !== PRIVATE_TASK_KEY) {
    return res.status(401).json({ error: "Invalid or missing security key" });
  }
  try {
    const privateTasks = await Task.find({ isPrivate: true })
      .populate("assignedTo", "username email")
      .populate({
        path: "assignedToTeam",
        populate: { path: "members", select: "username email" }
      });
    res.json(privateTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "username email")
      .populate({
        path: "assignedToTeam",
        populate: { path: "members", select: "username email" }
      });
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add a new task WITH FILE UPLOADS
router.post("/", fileUpload.array('files', 5), async (req, res) => {
  try {
    console.log('📝 Creating task with body:', req.body);
    console.log('📎 Files received:', req.files?.length || 0);
    
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      assignedToTeam,
      isTeamTask,
      createdBy,
      isRecurrent,
      recurrencePattern,
      recurrenceEndDate,
      isPrivate,
      privateKey
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    let finalIsPrivate = false;
    if (isPrivate === 'true' || isPrivate === true) {
      if (!privateKey || privateKey !== PRIVATE_TASK_KEY) {
        return res.status(401).json({ error: "Invalid security key for sensitive task" });
      }
      finalIsPrivate = true;
    }

    let recurrenceEndDateValue = recurrenceEndDate ? new Date(recurrenceEndDate) : null;

    // ✅ Process uploaded files - store in MongoDB as binary
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      data: file.buffer
    })) : [];

    console.log('✅ Processed attachments:', attachments.length);

    const newTask = new Task({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo || undefined,
      assignedToTeam: assignedToTeam || undefined,
      isTeamTask: isTeamTask === 'true' || isTeamTask === true,
      createdBy,
      isRecurrent: isRecurrent === 'true' || isRecurrent === true,
      recurrencePattern: recurrencePattern || "",
      recurrenceEndDate: recurrenceEndDateValue,
      isPrivate: finalIsPrivate,
      attachments // ✅ Add attachments to task
    });
    
    await newTask.save();
    console.log('✅ Task saved successfully with ID:', newTask._id);

    await newTask.populate("assignedTo", "username email");
    await newTask.populate({
      path: "assignedToTeam",
      populate: { path: "members", select: "username email" }
    });

    const creatorName = req.body.creatorName || "Admin";
    const assignedInfo = isTeamTask === 'true' || isTeamTask === true
      ? "Assigned to team" 
      : assignedTo ? "Assigned to user" : "";

    let details = assignedInfo;
    if (isRecurrent === 'true' || isRecurrent === true) {
      details += ` | Recurrent: ${recurrencePattern || "pattern not specified"}`;
    }
    if (attachments.length > 0) {
      details += ` | ${attachments.length} file(s) attached`;
    }

    await logActivity("created", newTask.title, creatorName, details);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('❌ Error creating task:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Download attachment from task
router.get("/:taskId/download/:attachmentId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    res.set({
      'Content-Type': attachment.mimetype,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      'Content-Length': attachment.data.length
    });
    
    res.send(attachment.data);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete attachment from task
router.delete("/:taskId/attachment/:attachmentId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const filename = attachment.filename;
    task.attachments = task.attachments.filter(
      att => att._id.toString() !== req.params.attachmentId
    );
    
    await task.save();

    // ✅ Use safe default — don't rely on req.body
    const username = "User"; // ← Fixed: no req.body.username
    await logActivity("updated", task.title, username, `Removed attachment: ${filename}`);

    res.json({ message: "Attachment deleted successfully" });
  } catch (err) {
    console.error('Delete attachment error:', err);
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
    const username = req.body.userId || "User"; // ← This is okay — userId is optional
    const { userId, ...updateData } = req.body;
    if (updateData.recurrenceEndDate) {
      updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
    }

    let nextDueDate = task.dueDate;
    if (
      updateData.status === "done" &&
      ((task.isRecurrent && task.recurrencePattern && task.recurrencePattern !== "none") ||
       (updateData.isRecurrent && updateData.recurrencePattern && updateData.recurrencePattern !== "none"))
    ) {
      if (
        task.recurrenceEndDate &&
        task.dueDate &&
        new Date(task.dueDate).toDateString() === new Date(task.recurrenceEndDate).toDateString()
      ) {
        updateData.status = "done";
      } else {
        const currentDate = new Date(task.dueDate || Date.now());
        switch (task.recurrencePattern) {
          case "daily":
            nextDueDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "weekly":
            nextDueDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "fortnight":
            nextDueDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case "monthly":
            nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
            break;
          default:
            break;
        }
        updateData.status = task.status;
        updateData.dueDate = nextDueDate;
        updateData.priority = task.priority;
      }
      if (!task.completionLog) task.completionLog = [];
      task.completionLog.push({
        completedAt: new Date(),
        completedBy: username
      });
      await task.save();
    }

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

// ✅ Delete task — FIXED TO PREVENT 500 ERROR
router.delete("/:id", async (req, res) => {
  try {
    // ✅ Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid task ID format" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskId = task._id;
    const taskTitle = task.title;

    // ✅ Delete first
    await Task.findByIdAndDelete(req.params.id);

    // ✅ Log activity with safe values
    const adminUsername = "Admin"; // ← Safe default
    await logActivity("deleted", taskId, adminUsername, `Task "${taskTitle}" deleted`);

    res.json({ message: "Task deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add comment to task
router.post("/:id/comment", async (req, res) => {
  try {
    console.log('🟢 /api/tasks/:id/comment route hit');
    console.log('Task ID:', req.params.id);
    console.log('Request body:', req.body);
    const { userId, username, userRole, text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      console.log('🔴 Task not found for ID:', req.params.id);
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
    console.log('🔴 Error in /api/tasks/:id/comment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Edit comment
router.put("/:taskId/comments/:commentId", async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Find comment by ID
    const commentIndex = task.comments.findIndex(
      (c) => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    task.comments[commentIndex].text = text;
    task.comments[commentIndex].updatedAt = new Date();
    await task.save();

    res.json(task);
  } catch (err) {
    console.error("Error editing comment:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete("/:taskId/comments/:commentId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const initialLength = task.comments.length;
    task.comments = task.comments.filter(c => c._id.toString() !== req.params.commentId);
    
    if (task.comments.length === initialLength) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await task.save();

    res.json(task);
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;