import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB Error:", err));

app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => res.send("API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
