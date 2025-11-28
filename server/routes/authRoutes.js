import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ username, email, password, role: "user" });
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    // Include createdAt in returned user so frontend can display join date
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users with role="user" (for task assignment dropdown - excludes admins)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" }, "username email role _id");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ALL users (for admin user management)
router.get("/all-users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "username email role _id createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role (admin only)
router.put("/users/:userId/role", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!["user", "team-manager", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "User role updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
