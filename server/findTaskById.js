import mongoose from "mongoose";
import Task from "./models/Task.js";

const taskId = process.argv[2];

mongoose.connect("mongodb://localhost:27017/task-manager")
  .then(async () => {
    const task = await Task.findById(taskId);
    if (task) {
      console.log("Task found:", task);
    } else {
      console.log("Task not found for ID:", taskId);
    }
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
