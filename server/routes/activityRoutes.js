import express from "express";
import Activity from "../models/Activity.js";

const router = express.Router();

// Get all activities
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find().sort({ timestamp: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log activity function (exported for use in other routes)
export const logActivity = async (action, task, user, details = "") => {
  try {
    console.log("=== LOGGING ACTIVITY ===");
    console.log("Action:", action);
    console.log("Task:", task);
    console.log("User:", user);
    console.log("Details:", details);
    // Normalize task to a string for the Activity model
    // If `task` is an object (task document), prefer storing the title; fall back to id.
    // If `task` is already a string, store it directly.
    let taskRef = null;
    if (task) {
      if (typeof task === 'string') {
        taskRef = task;
      } else if (typeof task === 'object') {
        taskRef = task.title || String(task._id || task.id || '') ;
      } else {
        taskRef = String(task);
      }
    }

    // If we still couldn't produce a taskRef, append task info to details
    if (!taskRef && task) {
      details = `${details} | Task: ${String(task)}`;
    }

    const activity = new Activity({
      action,
      task: taskRef || 'unknown',
      user,
      details
    });
    
    await activity.save();
    console.log("Activity saved successfully");
  } catch (err) {
    console.error("Error logging activity:", err);
  }
};

export default router;
