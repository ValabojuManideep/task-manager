// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import taskRoutes from "./routes/taskRoutes.js";
// import activityRoutes from "./routes/activityRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import chatRoutes from "./routes/chatRoutes.js";
// import leaderboardRoutes from "./routes/leaderboardRoutes.js";

// dotenv.config();
// const app = express();

// app.use(cors());
// app.use(express.json());

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ DB Error:", err));

// app.use("/api/tasks", taskRoutes);
// app.use("/api/activities", activityRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/leaderboard", leaderboardRoutes);

// app.get("/", (req, res) => res.send("API is running"));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import taskRoutes from "./routes/taskRoutes.js";
// import activityRoutes from "./routes/activityRoutes.js";
// import teamRoutes from "./routes/teamRoutes.js";

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/activity", activityRoutes);
// app.use("/api/teams", teamRoutes);

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => console.log(err));

// app.listen(5000, () => console.log("🚀 Server running on port 5000"));


// ⚠️ CRITICAL: Load env vars FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import notificationService from "./utils/notificationService.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

// Import models to ensure they are registered with mongoose early
import "./models/User.js";
import "./models/Team.js";
import "./models/Task.js";
import "./models/Activity.js";
import "./models/Conversation.js";
import "./models/Message.js";
const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    // Start background services that depend on the DB
    try {
      notificationService.start();
    } catch (err) {
      console.error('❌ Failed to start notification service:', err);
    }
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "✅ API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Log registered routes for debugging
  try {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // routes registered directly on the app
        routes.push(middleware.route.path);
      } else if (middleware.name === 'router') {
        // router middleware
        middleware.handle.stack.forEach((handler) => {
          const route = handler.route;
          if (route) routes.push(route.path);
        });
      }
    });
    console.log('Registered routes:', routes);
  } catch (err) {
    console.warn('Could not list routes:', err.message);
  }
});
console.log("SERVER.JS IS RUNNING");
