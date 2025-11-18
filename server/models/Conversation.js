import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    lastMessage: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
