import Task from './models/Task.js';
import User from './models/User.js';
import Reminder from './models/Reminder.js';
import { sendMail } from './utils/mailer.js';

const REMINDER_WINDOW_HOURS = Number(process.env.REMINDER_WINDOW_HOURS || 24); // how far ahead to remind
const CHECK_INTERVAL_MINUTES = Number(process.env.REMINDER_CHECK_INTERVAL_MINUTES || 60);
const ENABLE_REMINDERS = process.env.REMINDERS_ENABLED !== 'false';

function hoursBetween(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

async function checkAndSendReminders() {
  if (!ENABLE_REMINDERS) return;

  const now = new Date();
  const upper = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  try {
    // Find tasks with dueDate in (now, upper] and not done
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: upper },
      status: { $ne: 'done' }
    }).populate('assignedTo').populate('assignedToTeam');

    for (const task of tasks) {
      const hoursLeft = hoursBetween(now, new Date(task.dueDate));

      // Handle individual task reminders
      if (task.assignedTo && task.assignedTo.email) {
        const user = await User.findById(task.assignedTo._id);
        if (user && user.email) {
          // Skip if we've already sent this reminder
          const exists = await Reminder.exists({ taskId: task._id, userId: user._id, type: 'due_soon' });
          if (!exists) {
            const subject = `Reminder: Task "${task.title}" is due in ${Math.ceil(hoursLeft)} hour(s)`;
            const text = `Hi ${user.username || ''},\n\nThis is a reminder that the task \"${task.title}\" is due on ${new Date(task.dueDate).toLocaleString()}.\n\nTask details:\n${task.description || ''}\n\nPlease take any necessary action.\n\n— Task Manager`;

            await sendMail({ to: user.email, subject, text });

            try {
              await Reminder.create({ taskId: task._id, userId: user._id, type: 'due_soon' });
            } catch (err) {
              if (err.code !== 11000) console.error('Failed to create reminder record:', err);
            }
          }
        }
      }

      // Handle team task reminders - send to all team members
      if (task.isTeamTask && task.assignedToTeam) {
        const team = await Task.findById(task._id).populate({
          path: 'assignedToTeam',
          populate: { path: 'members' }
        });

        if (team && team.assignedToTeam && team.assignedToTeam.members) {
          for (const member of team.assignedToTeam.members) {
            const teamMember = await User.findById(member._id);
            if (teamMember && teamMember.email) {
              // Skip if we've already sent this reminder to this team member
              const exists = await Reminder.exists({ taskId: task._id, userId: teamMember._id, type: 'due_soon_team' });
              if (!exists) {
                const subject = `Team Reminder: Task "${task.title}" is due in ${Math.ceil(hoursLeft)} hour(s)`;
                const text = `Hi ${teamMember.username || ''},\n\nThis is a team reminder that the task \"${task.title}\" assigned to team \"${team.assignedToTeam.name}\" is due on ${new Date(task.dueDate).toLocaleString()}.\n\nTask details:\n${task.description || ''}\n\nPlease take any necessary action.\n\n— Task Manager`;

                await sendMail({ to: teamMember.email, subject, text });

                try {
                  await Reminder.create({ taskId: task._id, userId: teamMember._id, type: 'due_soon_team' });
                } catch (err) {
                  if (err.code !== 11000) console.error('Failed to create team reminder record:', err);
                }
              }
            }
          }
        }
      }
    }
    // Return matched tasks (so callers can inspect which tasks were considered)
    return tasks;
  } catch (err) {
    console.error('Error in reminder check:', err);
    return [];
  }
}

let intervalHandle = null;

export default {
  start() {
    if (!ENABLE_REMINDERS) {
      console.log('⚠️ Reminders disabled (REMIN DERS_ENABLED=false)');
      return;
    }

    // Run immediately, then on interval
    checkAndSendReminders();
    intervalHandle = setInterval(checkAndSendReminders, CHECK_INTERVAL_MINUTES * 60 * 1000);
    console.log(`✅ Notification service started: checking every ${CHECK_INTERVAL_MINUTES} minute(s) for tasks due within ${REMINDER_WINDOW_HOURS} hour(s)`);
  },
  stop() {
    if (intervalHandle) clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('Notification service stopped');
  }
};

// Also export a function to trigger a single immediate check (useful for testing)
export async function runOnce() {
  const result = await checkAndSendReminders();
  return result || [];
}
