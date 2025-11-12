import express from "express";
import Task from "../models/Task.js";
// Ensure Team model is registered with mongoose before populate() runs
import Team from "../models/Team.js";
import { logActivity } from "./activityRoutes.js";

const router = express.Router();

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

// Add a new task
router.post("/", async (req, res) => {
  try {
    // Debug: log incoming request body
    console.log('Incoming task creation request:', req.body);

    // Explicitly pick recurrent fields from body for clarity
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
      recurrenceEndDate
    } = req.body;

    // Convert recurrenceEndDate to Date if present
    let recurrenceEndDateValue = recurrenceEndDate ? new Date(recurrenceEndDate) : null;

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      assignedToTeam,
      isTeamTask,
      createdBy,
      isRecurrent: !!isRecurrent,
      recurrencePattern: recurrencePattern || "",
      recurrenceEndDate: recurrenceEndDateValue
    });
    await newTask.save();

    // Debug: log saved task
    console.log('Saved task:', newTask);

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

    let details = assignedInfo;
    if (isRecurrent) {
      details += ` | Recurrent: ${recurrencePattern || "pattern not specified"}`;
    }

    await logActivity("created", newTask.title, creatorName, details);
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
    // Convert recurrenceEndDate to Date if present
    if (updateData.recurrenceEndDate) {
      updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
    }

    // Always process recurrence logic for recurrent tasks when status is set to 'done'
    let nextDueDate = task.dueDate;
    if (
      updateData.status === "done" &&
      ((task.isRecurrent && task.recurrencePattern && task.recurrencePattern !== "none") ||
       (updateData.isRecurrent && updateData.recurrencePattern && updateData.recurrencePattern !== "none"))
    ) {
      // If dueDate matches recurrenceEndDate, mark as done and do not update due date
      if (
        task.recurrenceEndDate &&
        task.dueDate &&
        new Date(task.dueDate).toDateString() === new Date(task.recurrenceEndDate).toDateString()
      ) {
        updateData.status = "done";
        // Optionally, you can set a flag or message here
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
        // Keep the same priority and status for the next recurrence
        updateData.status = task.status;
        updateData.dueDate = nextDueDate;
        updateData.priority = task.priority;
      }
      // Add completion log entry
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
