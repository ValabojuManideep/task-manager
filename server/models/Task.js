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
  data: { type: Buffer, required: true }, // Binary data stored in MongoDB
});

// 🧩 Sub-schema for comments
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  userRole: { type: String, required: true },
  text: { type: String, required: true },
  attachments: [fileSchema], // store files within comments
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

// 🧩 Main Task Schema
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

    // ✅ Files attached directly to this task
    attachments: [fileSchema],

    // Recurrent task settings
    isRecurrent: { type: Boolean, default: false },
    recurrencePattern: { type: String, default: "" },
    recurrenceEndDate: { type: Date, default: null },

    // Sensitive task (security key)
    isPrivate: { type: Boolean, default: false },

    // Comments array
    comments: [commentSchema],

    // Completion log for recurrent tasks
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
