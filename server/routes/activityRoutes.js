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
    
    const activity = new Activity({ 
      action, 
      task, 
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
