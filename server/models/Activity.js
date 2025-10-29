import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  task: { type: String, required: true }, // Changed from taskTitle to task
  user: { type: String, required: true },
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Activity", activitySchema);
