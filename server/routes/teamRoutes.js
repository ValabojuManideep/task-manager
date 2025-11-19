import express from "express";
import Team from "../models/Team.js";
import Task from "../models/Task.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { isTeamManager } from "../middleware/teamManagerMiddleware.js";

const router = express.Router();

// Get all teams
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("members", "username email role")
      .populate("teamManagers", "username email role") // ✅ NEW
      .populate("createdBy", "username email");
    res.json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get single team
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members", "username email role")
      .populate("teamManagers", "username email role") // ✅ NEW
      .populate("createdBy", "username email");
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json(team);
  } catch (err) {
    console.error("Error fetching team:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create new team
router.post("/", async (req, res) => {
  try {
    console.log("Creating team with data:", req.body);
    
    const newTeam = new Team(req.body);
    await newTeam.save();
    
    await newTeam.populate("members", "username email role");
    await newTeam.populate("teamManagers", "username email role"); // ✅ NEW
    await newTeam.populate("createdBy", "username email");
    
    console.log("Team created successfully:", newTeam);
    res.status(201).json(newTeam);
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update team
router.put("/:id", async (req, res) => {
  try {
    console.log("Updating team:", req.params.id);
    
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: false }
    )
      .populate("members", "username email role")
      .populate("teamManagers", "username email role") // ✅ NEW
      .populate("createdBy", "username email");
    
    if (!updatedTeam) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    console.log("Team updated successfully:", updatedTeam);
    res.json(updatedTeam);
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete team
router.delete("/:id", async (req, res) => {
  try {
    const deletedTeam = await Team.findByIdAndDelete(req.params.id);
    
    if (!deletedTeam) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Assign team manager (admin only)
router.post("/:teamId/managers", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if already a manager
    if (team.teamManagers.includes(userId)) {
      return res.status(400).json({ error: "User is already a team manager" });
    }

    team.teamManagers.push(userId);
    await team.save();

    await team.populate("teamManagers", "username email role");
    await team.populate("members", "username email role");
    await team.populate("createdBy", "username email");

    res.json({ 
      message: "Team manager assigned successfully", 
      team 
    });
  } catch (err) {
    console.error("Error assigning team manager:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Remove team manager (admin only)
router.delete("/:teamId/managers/:userId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    team.teamManagers = team.teamManagers.filter(
      id => id.toString() !== req.params.userId
    );
    await team.save();

    await team.populate("teamManagers", "username email role");
    await team.populate("members", "username email role");

    res.json({ 
      message: "Team manager removed successfully", 
      team 
    });
  } catch (err) {
    console.error("Error removing team manager:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Get team tasks (team manager can access)
router.get("/:teamId/tasks", authenticate, isTeamManager, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedToTeam: req.params.teamId })
      .populate("assignedTo", "username email")
      .populate("createdBy", "username email")
      .populate({
        path: "assignedToTeam",
        populate: { path: "members", select: "username email" }
      });
    
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching team tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Add member to team (team manager can do this)
router.post("/:teamId/members", authenticate, isTeamManager, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const team = req.team; // From middleware

    // Check if already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({ error: "User is already a team member" });
    }

    team.members.push(userId);
    await team.save();

    await team.populate("members", "username email role");
    await team.populate("teamManagers", "username email role");

    res.json({ 
      message: "Member added successfully", 
      team 
    });
  } catch (err) {
    console.error("Error adding team member:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Remove member from team (team manager can do this)
router.delete("/:teamId/members/:userId", authenticate, isTeamManager, async (req, res) => {
  try {
    const team = req.team; // From middleware

    team.members = team.members.filter(
      id => id.toString() !== req.params.userId
    );
    await team.save();

    await team.populate("members", "username email role");
    await team.populate("teamManagers", "username email role");

    res.json({ 
      message: "Member removed successfully", 
      team 
    });
  } catch (err) {
    console.error("Error removing team member:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
