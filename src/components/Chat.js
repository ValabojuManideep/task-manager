import React, { useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";
import useAppStore from "../store/useAppStore";

export default function Chat({ teamId, otherUser, currentUser, onClose, conversation: initialConversation }) {
  const conversation = useAppStore((s) => s.chat_conversation) || initialConversation || null;
  const setConversation = useAppStore((s) => s.setChat_conversation);
  const messages = useAppStore((s) => s.chat_messages);
  const setMessages = useAppStore((s) => s.setChat_messages);
  const text = useAppStore((s) => s.chat_text);
  const setText = useAppStore((s) => s.setChat_text);
  const bodyRef = useRef();

  useEffect(() => {
    if (!initialConversation) {
      if (!teamId || !otherUser || !currentUser) return;

      const createOrGetConversation = async () => {
        try {
          const { data } = await axios.post("http://localhost:5000/api/chat/conversations", {
            teamId,
            participantId: otherUser._id,
            senderId: currentUser.id
          });
          setConversation(data);
        } catch (err) {
          console.error("Failed to create/get conversation", err);
        }
      };

      createOrGetConversation();
    }
  }, [teamId, otherUser, currentUser]);

  useEffect(() => {
    let timer;
    const fetchMessages = async () => {
      try {
        if (!conversation) return;
        const { data } = await axios.get(`http://localhost:5000/api/chat/messages/${conversation._id}`);
        setMessages(data);
        // scroll to bottom
        if (bodyRef.current) {
          bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
    // poll every 2.5s for simplicity
    timer = setInterval(fetchMessages, 2500);
    return () => clearInterval(timer);
  }, [conversation]);

  // derive the display user (other participant) when otherUser not provided
  const setDisplayUser = useAppStore((s) => s.setChat_displayUser);
  const [displayUser, setLocalDisplayUser] = React.useState(otherUser || null);

  useEffect(() => {
    const resolveOther = async () => {
      // Always use otherUser if provided
      if (otherUser) return setLocalDisplayUser(otherUser);
      if (!conversation) return setLocalDisplayUser(null);

      // conversation may have participants populated or only ids
      const participants = conversation.participants || [];
      // if participants are objects with username, pick the other
      const hasObjects = participants.length > 0 && typeof participants[0] === 'object' && participants[0].username;
      if (hasObjects) {
        const other = participants.find((p) => String(p._id) !== String(currentUser.id) && String(p._id) !== String(currentUser._id));
        setLocalDisplayUser(other || participants[0]);
        return;
      }

      // otherwise fetch populated conversation from server
      try {
        const { data } = await axios.get(`http://localhost:5000/api/chat/conversations/${conversation._id}`);
        setConversation(data); // populated
        const other = data.participants.find((p) => String(p._id) !== String(currentUser.id) && String(p._id) !== String(currentUser._id));
        setLocalDisplayUser(other || data.participants[0]);
      } catch (err) {
        console.error('Failed to resolve conversation participants', err);
        setLocalDisplayUser(null);
      }
    };

    resolveOther();
  }, [conversation, otherUser, currentUser, setConversation]);

  const handleSend = async () => {
    if (!text.trim() || !conversation) return;
    try {
      await axios.post("http://localhost:5000/api/chat/messages", {
        conversationId: conversation._id,
        senderId: currentUser.id,
        text: text.trim()
      });
      setText("");
      // immediate fetch
      const { data } = await axios.get(`http://localhost:5000/api/chat/messages/${conversation._id}`);
      setMessages(data);
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div>
            <strong>Chat with {displayUser?.username || 'Conversation'}</strong>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{displayUser?.email || ''}</div>
          </div>
          <div>
            <button className="chat-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="chat-body" ref={bodyRef}>
          {messages.map((m) => {
            const senderId = m.sender?._id || m.sender;
            const isMe = String(senderId) === String(currentUser.id) || String(senderId) === String(currentUser._id);
            const senderName = m.sender?.username || (m.sender?._id || m.sender);
            return (
              <div key={m._id} className={`message ${isMe ? "me" : "other"}`}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{senderName}</div>
                <div style={{ marginTop: 6 }}>{m.text}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          />
          <button className="chat-send-btn" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
