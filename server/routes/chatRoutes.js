import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Team from "../models/Team.js";

const router = express.Router();

// Create or get a 1:1 conversation within a team
router.post("/conversations", async (req, res) => {
  try {
    const { teamId, participantId, senderId } = req.body;

    if (!teamId || !participantId || !senderId) {
      return res.status(400).json({ error: "teamId, participantId and senderId required" });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Ensure both users are members of the team
    const members = team.members.map((m) => m.toString());
    if (!members.includes(participantId) || !members.includes(senderId)) {
      return res.status(403).json({ error: "Both users must be members of the team" });
    }

    // Look for existing conversation with same team and same pair of participants
    const participantsSet = [participantId, senderId].sort();
    let conv = await Conversation.findOne({
      team: teamId,
      participants: { $all: participantsSet, $size: 2 }
    });

    if (!conv) {
      conv = new Conversation({ team: teamId, participants: participantsSet });
      await conv.save();
    }

    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List conversations for a user within a team
router.get("/conversations", async (req, res) => {
  try {
    const { teamId, userId } = req.query;
    if (!teamId || !userId) return res.status(400).json({ error: "teamId and userId required" });

    const convs = await Conversation.find({ team: teamId, participants: userId })
      .populate("participants", "username email")
      .sort({ updatedAt: -1 });

    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single conversation populated with participants
router.get("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await Conversation.findById(id).populate("participants", "username email");
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message in a conversation
router.post("/messages", async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;
    if (!conversationId || !senderId || !text) return res.status(400).json({ error: "conversationId, senderId and text required" });

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    if (!conv.participants.map((p) => p.toString()).includes(senderId)) {
      return res.status(403).json({ error: "Sender is not part of the conversation" });
    }

    const msg = new Message({ conversation: conversationId, sender: senderId, text });
    await msg.save();

    // Update conversation lastMessage and timestamp
    conv.lastMessage = text;
    await conv.save();

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a conversation
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username email")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
