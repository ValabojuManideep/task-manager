import Team from "../models/Team.js";
import Task from "../models/Task.js";

// Check if user is a team manager for the specified team
export const isTeamManager = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const teamId = req.params.teamId || req.body.teamId;

    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if user is team manager or admin
    const isManager = team.teamManagers.some(
      managerId => managerId.toString() === userId
    );

    if (!isManager && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Only team managers or admins can perform this action." 
      });
    }

    req.team = team; // Attach team to request
    next();
  } catch (err) {
    console.error("Team manager middleware error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Check if user can manage team tasks (add/remove members)
export const canManageTeamTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.taskId || req.params.id;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // If not a team task, deny access
    if (!task.isTeamTask || !task.assignedToTeam) {
      return res.status(400).json({ error: "This is not a team task" });
    }

    const team = await Team.findById(task.assignedToTeam);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if user is team manager or admin
    const isManager = team.teamManagers.some(
      managerId => managerId.toString() === userId
    );

    if (!isManager && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Only team managers or admins can manage team tasks." 
      });
    }

    req.task = task; // Attach task to request
    req.team = team; // Attach team to request
    next();
  } catch (err) {
    console.error("Team task management middleware error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Check if user can comment on team task
export const canCommentOnTeamTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id || req.params.taskId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // If not a team task, allow normal comment flow
    if (!task.isTeamTask) {
      return next();
    }

    if (!task.assignedToTeam) {
      return res.status(400).json({ error: "Team task has no assigned team" });
    }

    const team = await Team.findById(task.assignedToTeam);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if user is team manager, team member, or admin
    const isManager = team.teamManagers.some(
      managerId => managerId.toString() === userId
    );
    const isMember = team.members.some(
      memberId => memberId.toString() === userId
    );

    if (!isManager && !isMember && req.user.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. You must be a team manager, member, or admin to comment on this task." 
      });
    }

    next();
  } catch (err) {
    console.error("Comment permission middleware error:", err);
    res.status(500).json({ error: err.message });
  }
};
