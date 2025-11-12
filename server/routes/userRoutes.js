import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    res.json({ message: "User created successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, user });
});

// Get user by id (public for now; do not return password)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username email role createdAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of users (filtering to role=user can be done by caller)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "username email role _id createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user (allow updating username and email)
router.put("/:id", async (req, res) => {
  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;

    // If username is being updated, ensure it's unique
    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ error: "Username already taken" });
    }

    if (updates.email) {
      const existingEmail = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
      if (existingEmail) return res.status(400).json({ error: "Email already in use" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("username email role createdAt");
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
