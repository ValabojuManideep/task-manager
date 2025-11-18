import express from "express";
import {
  calculateTeamPerformance,
  calculateMemberPerformance,
  getTeamMemberPerformance
} from "../utils/performanceCalculator.js";

const router = express.Router();

/**
 * Get team performance leaderboard
 * Ranked by performance score (completion rate, on-time delivery, priority tasks)
 */
router.get("/teams", async (req, res) => {
  try {
    const leaderboard = await calculateTeamPerformance();
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get member performance leaderboard
 * Ranked by member performance score
 */
router.get("/members", async (req, res) => {
  try {
    const leaderboard = await calculateMemberPerformance();
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching member leaderboard:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get team members' performance within a specific team
 * @param teamId - Team ID
 */
router.get("/team/:teamId/members", async (req, res) => {
  try {
    const { teamId } = req.params;
    const performance = await getTeamMemberPerformance(teamId);
    res.json(performance);
  } catch (error) {
    console.error("Error fetching team member performance:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
