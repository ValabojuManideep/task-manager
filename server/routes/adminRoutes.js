import express from 'express';
import { runOnce } from '../notificationService.js';

const router = express.Router();

async function triggerHandler(req, res) {
  try {
    const tasks = await runOnce();
    // Map minimal task info for response
    const mapped = (tasks || []).map(t => ({
      id: t._id,
      title: t.title,
      dueDate: t.dueDate,
      assignedTo: t.assignedTo && (t.assignedTo._id || t.assignedTo)
    }));
    res.json({ message: 'Reminder check triggered', matchedCount: mapped.length, matched: mapped });
  } catch (err) {
    console.error('Error triggering reminders:', err);
    res.status(500).json({ error: err.message });
  }
}

// Support both GET and POST for easier testing
router.post('/notifications/trigger', triggerHandler);
router.get('/notifications/trigger', triggerHandler);

export default router;
