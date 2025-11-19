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

// 🧩 Sub-schema for file attachments
const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  data: { type: Buffer, required: true },
});

// 🧩 Sub-schema for comments - UPDATED
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  userRole: { 
    type: String, 
    enum: ["admin", "user", "team-manager"], // ✅ UPDATED
    required: true 
  },
  text: { type: String, required: true },
  attachments: [fileSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

// 🧩 Main Task Schema (rest remains the same)
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedToTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    isTeamTask: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: [fileSchema],
    isRecurrent: { type: Boolean, default: false },
    recurrencePattern: { type: String, default: "" },
    recurrenceEndDate: { type: Date, default: null },
    isPrivate: { type: Boolean, default: false },
    comments: [commentSchema],
    completionLog: [
      {
        completedAt: { type: Date, default: Date.now },
        completedBy: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);

