import Task from "../models/Task.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

/**
 * Calculate performance metrics for teams and members
 */

export const calculateTeamPerformance = async () => {
  try {
    const teams = await Team.find().populate("members");
    const leaderboardData = [];

    for (const team of teams) {
      const teamTasks = await Task.find({
        assignedToTeam: team._id
      });

      const completedTasks = teamTasks.filter(
        (task) => task.status === "done"
      ).length;
      const totalTasks = teamTasks.length;
      const completionRate =
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

      // Calculate average task completion time
      const completedTasksData = teamTasks.filter(
        (task) => task.status === "done"
      );
      let avgCompletionTime = 0;

      if (completedTasksData.length > 0) {
        const totalTime = completedTasksData.reduce((acc, task) => {
          const createdTime = new Date(task.createdAt).getTime();
          const completedTime = new Date(task.updatedAt).getTime();
          return acc + (completedTime - createdTime);
        }, 0);
        avgCompletionTime = Math.round(totalTime / completedTasksData.length / (1000 * 60 * 60)); // in hours
      }

      // Calculate high priority task completion
      const highPriorityTasks = teamTasks.filter(
        (task) => task.priority === "high"
      ).length;
      const highPriorityCompleted = teamTasks.filter(
        (task) => task.priority === "high" && task.status === "done"
      ).length;

      // Calculate on-time tasks
      const onTimeCompleted = completedTasksData.filter((task) => {
        if (!task.dueDate) return false;
        return new Date(task.updatedAt) <= new Date(task.dueDate);
      }).length;
      const onTimeRate =
        completedTasksData.length > 0
          ? ((onTimeCompleted / completedTasksData.length) * 100).toFixed(2)
          : 0;

      // Calculate performance score
      const performanceScore =
        parseFloat(completionRate) * 0.4 +
        (highPriorityCompleted / (highPriorityTasks || 1)) * 100 * 0.3 +
        parseFloat(onTimeRate) * 0.3;

      // include rich member info for frontend display
      const membersRich = team.members.map((m) => ({
        userId: m._id,
        username: m.username,
        email: m.email,
        role: m.role || "user",
        createdAt: m.createdAt
      }));

      leaderboardData.push({
        teamId: team._id,
        teamName: team.name,
        description: team.description,
        memberCount: team.members.length,
        totalTasks,
        completedTasks,
        completionRate: parseFloat(completionRate),
        avgCompletionTime,
        highPriorityTasks,
        highPriorityCompleted,
        onTimeRate: parseFloat(onTimeRate),
        performanceScore: parseFloat(performanceScore.toFixed(2)),
        members: membersRich
      });
    }

    // Sort by performance score
    leaderboardData.sort((a, b) => b.performanceScore - a.performanceScore);

    return leaderboardData;
  } catch (error) {
    console.error("Error calculating team performance:", error);
    throw error;
  }
};

export const calculateMemberPerformance = async () => {
  try {
    // include all users (admins excluded), include team memberships
    const users = await User.find({ role: "user" });
    const memberLeaderboard = [];

    for (const user of users) {
      const userTasks = await Task.find({
        assignedTo: user._id
      });

      const completedTasks = userTasks.filter(
        (task) => task.status === "done"
      ).length;
      const totalTasks = userTasks.length;
      const completionRate =
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

      // Calculate task completion time
      const completedTasksData = userTasks.filter(
        (task) => task.status === "done"
      );
      let avgCompletionTime = 0;

      if (completedTasksData.length > 0) {
        const totalTime = completedTasksData.reduce((acc, task) => {
          const createdTime = new Date(task.createdAt).getTime();
          const completedTime = new Date(task.updatedAt).getTime();
          return acc + (completedTime - createdTime);
        }, 0);
        avgCompletionTime = Math.round(totalTime / completedTasksData.length / (1000 * 60 * 60)); // in hours
      }

      // Calculate high priority task completion
      const highPriorityTasks = userTasks.filter(
        (task) => task.priority === "high"
      ).length;
      const highPriorityCompleted = userTasks.filter(
        (task) => task.priority === "high" && task.status === "done"
      ).length;

      // Calculate on-time tasks
      const onTimeCompleted = completedTasksData.filter((task) => {
        if (!task.dueDate) return false;
        return new Date(task.updatedAt) <= new Date(task.dueDate);
      }).length;
      const onTimeRate =
        completedTasksData.length > 0
          ? ((onTimeCompleted / completedTasksData.length) * 100).toFixed(2)
          : 0;

      // Calculate tasks in progress
      const inProgressTasks = userTasks.filter(
        (task) => task.status === "in_progress"
      ).length;

      // Calculate performance score (Member specific)
      const performanceScore =
        parseFloat(completionRate) * 0.3 +
        (highPriorityCompleted / (highPriorityTasks || 1)) * 100 * 0.3 +
        parseFloat(onTimeRate) * 0.25 +
        (1 - Math.min(inProgressTasks / (totalTasks || 1), 1)) * 100 * 0.15;

      memberLeaderboard.push({
        userId: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role || "user",
        teams: [] /* populated below */,
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate: parseFloat(completionRate),
        avgCompletionTime,
        highPriorityTasks,
        highPriorityCompleted,
        onTimeRate: parseFloat(onTimeRate),
        performanceScore: parseFloat(performanceScore.toFixed(2))
      });
    }

    // Sort by performance score
    memberLeaderboard.sort((a, b) => b.performanceScore - a.performanceScore);

    // Populate teams for each user (minimal: id + name)
    for (const entry of memberLeaderboard) {
      try {
        const teams = await Team.find({ members: entry.userId }).select("name _id");
        entry.teams = teams.map((t) => ({ teamId: t._id, teamName: t.name }));
      } catch (err) {
        entry.teams = [];
      }
    }

    return memberLeaderboard;
  } catch (error) {
    console.error("Error calculating member performance:", error);
    throw error;
  }
};

export const getTeamMemberPerformance = async (teamId) => {
  try {
    const team = await Team.findById(teamId).populate("members");

    if (!team) {
      throw new Error("Team not found");
    }

    const memberPerformance = [];

    // Pull all tasks for the team once and attribute them to members.
    const teamTasks = await Task.find({ assignedToTeam: teamId });

    for (const member of team.members) {
      const possibleCompletedByValues = [
        member._id ? member._id.toString() : null,
        member.username,
        member.email
      ].filter(Boolean);

      // Only consider tasks assigned to the team. Attribute a task to a member when:
      // - the task.assignedTo equals the member._id, OR
      // - the task.completionLog contains an entry with completedBy matching the member (id/username/email).
      const tasksForMember = teamTasks.filter((task) => {
        // assignedTo may be an ObjectId
        const assignedToMatch = task.assignedTo && task.assignedTo.toString && task.assignedTo.toString() === member._id.toString();

        const completedLogMatch = Array.isArray(task.completionLog)
          ? task.completionLog.some((cl) => possibleCompletedByValues.includes(cl.completedBy))
          : false;

        return assignedToMatch || completedLogMatch;
      });

      const completedTasks = tasksForMember.filter((task) => task.status === "done").length;
      const totalTasks = tasksForMember.length;
      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

      const completedTasksData = tasksForMember.filter((task) => task.status === "done");
      let avgCompletionTime = 0;

      if (completedTasksData.length > 0) {
        const totalTime = completedTasksData.reduce((acc, task) => {
          const createdTime = new Date(task.createdAt).getTime();
          const completedTime = new Date(task.updatedAt).getTime();
          return acc + (completedTime - createdTime);
        }, 0);
        avgCompletionTime = Math.round(totalTime / completedTasksData.length / (1000 * 60 * 60));
      }

      const inProgressTasks = tasksForMember.filter((task) => task.status === "in_progress").length;

      // Calculate high priority task completion for team-scoped tasks
      const highPriorityTasks = tasksForMember.filter((task) => task.priority === "high").length;
      const highPriorityCompleted = tasksForMember.filter((task) => task.priority === "high" && task.status === "done").length;

      // Calculate on-time tasks for the member within the team
      const onTimeCompleted = completedTasksData.filter((task) => {
        if (!task.dueDate) return false;
        return new Date(task.updatedAt) <= new Date(task.dueDate);
      }).length;
      const onTimeRate =
        completedTasksData.length > 0
          ? ((onTimeCompleted / completedTasksData.length) * 100).toFixed(2)
          : 0;

      // Calculate a performance score scoped to the team tasks for this member
      const performanceScore =
        parseFloat(completionRate) * 0.3 +
        (highPriorityCompleted / (highPriorityTasks || 1)) * 100 * 0.3 +
        parseFloat(onTimeRate) * 0.25 +
        (1 - Math.min(inProgressTasks / (totalTasks || 1), 1)) * 100 * 0.15;

      memberPerformance.push({
        memberId: member._id,
        username: member.username,
        email: member.email,
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate: parseFloat(completionRate),
        avgCompletionTime,
        highPriorityTasks,
        highPriorityCompleted,
        onTimeRate: parseFloat(onTimeRate),
        performanceScore: parseFloat(performanceScore.toFixed(2))
      });
    }

    // Sort by completion rate
    memberPerformance.sort((a, b) => b.completionRate - a.completionRate);

    return memberPerformance;
  } catch (error) {
    console.error("Error calculating team member performance:", error);
    throw error;
  }
};
