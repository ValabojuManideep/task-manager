import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["todo", "in_progress", "done"],
    default: "todo",
  },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Task", taskSchema);
