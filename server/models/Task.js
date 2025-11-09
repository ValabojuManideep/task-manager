// import mongoose from "mongoose";

// const commentSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   username: { type: String, required: true },
//   userRole: { type: String, enum: ["admin", "user"], required: true }, // Add this
//   text: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now } // Add this
// });

// const taskSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
//   priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
//   dueDate: { type: Date },
//   assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   comments: [commentSchema],
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("Task", taskSchema);

import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userRole: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['todo', 'in_progress', 'done'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  dueDate: { type: Date },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // NEW: Add team field
  assignedToTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  // NEW: Track if it's a team task
  isTeamTask: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Task", taskSchema);
