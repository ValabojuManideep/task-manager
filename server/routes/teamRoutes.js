// import express from "express";
// import Team from "../models/Team.js";

// const router = express.Router();

// // Get all teams
// router.get("/", async (req, res) => {
//   try {
//     const teams = await Team.find()
//       .populate("members", "username email")
//       .populate("createdBy", "username email");
//     res.json(teams);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get single team
// router.get("/:id", async (req, res) => {
//   try {
//     const team = await Team.findById(req.params.id)
//       .populate("members", "username email")
//       .populate("createdBy", "username email");
//     if (!team) {
//       return res.status(404).json({ error: "Team not found" });
//     }
//     res.json(team);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Create new team
// router.post("/", async (req, res) => {
//   try {
//     const newTeam = new Team(req.body);
//     await newTeam.save();
//     await newTeam.populate("members", "username email");
//     await newTeam.populate("createdBy", "username email");
//     res.status(201).json(newTeam);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Update team
// router.put("/:id", async (req, res) => {
//   try {
//     const updatedTeam = await Team.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     )
//       .populate("members", "username email")
//       .populate("createdBy", "username email");
//     res.json(updatedTeam);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Delete team
// router.delete("/:id", async (req, res) => {
//   try {
//     await Team.findByIdAndDelete(req.params.id);
//     res.json({ message: "Team deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;



import express from "express";
import Team from "../models/Team.js";

const router = express.Router();

// Get all teams
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("members", "username email")
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
      .populate("members", "username email")
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
    
    await newTeam.populate("members", "username email");
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
      .populate("members", "username email")
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

export default router;
