import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true }, // "created", "updated", "deleted"
  taskTitle: { type: String, required: true },
  userId: { type: String },
  details: { type: String }, // Extra info like "status changed from To Do to Done"
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Activity", activitySchema);
