import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, default: 'due_soon' },
  sentAt: { type: Date, default: Date.now }
});

// Prevent duplicate reminders for same task/user/type
reminderSchema.index({ taskId: 1, userId: 1, type: 1 }, { unique: true });

export default mongoose.model('Reminder', reminderSchema);
