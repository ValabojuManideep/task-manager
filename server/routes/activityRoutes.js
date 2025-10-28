import express from "express";
import Activity from "../models/Activity.js";

const router = express.Router();

// Get all activities
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find().sort({ timestamp: -1 }).limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add activity (called internally by other routes)
export const logActivity = async (action, taskTitle, userId, details = "") => {
  try {
    const activity = new Activity({ action, taskTitle, userId, details });
    await activity.save();
  } catch (err) {
    console.error("Activity log error:", err);
  }
};

export default router;
