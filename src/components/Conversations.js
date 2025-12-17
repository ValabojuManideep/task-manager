import React, { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import Chat from "./Chat";
import "./Chat.css";
import useAppStore from "../store/useAppStore";


export default function Conversations() {
  const teams = useAppStore((s) => s.teams);
  const { user } = useAuth();
  const userTeams = useAppStore((s) => s.conv_userTeams);
  const setUserTeams = useAppStore((s) => s.setConv_userTeams);
  const selectedTeam = useAppStore((s) => s.conv_selectedTeam);
  const setSelectedTeam = useAppStore((s) => s.setConv_selectedTeam);
  const activeConv = useAppStore((s) => s.conv_activeConv);
  const setActiveConv = useAppStore((s) => s.setConv_activeConv);
  const activeTeamForConv = useAppStore((s) => s.conv_activeTeamForConv);
  const setActiveTeamForConv = useAppStore((s) => s.setConv_activeTeamForConv);


  useEffect(() => {
    if (!teams || !user) return setUserTeams([]);
    
    // ✅ FIX: Filter teams where current user is a member OR a team manager
    const filtered = teams.filter((t) => {
      const members = t.members || [];
      const teamManagers = t.teamManagers || [];
      
      // Check if user is a member
      const isMember = members.some((m) => {
        const id = m._id || m;
        return String(id) === String(user.id) || String(id) === String(user._id);
      });
      
      // Check if user is a team manager
      const isTeamManager = teamManagers.some((m) => {
        const id = m._id || m;
        return String(id) === String(user.id) || String(id) === String(user._id);
      });
      
      return isMember || isTeamManager;
    });
    
    console.log("📋 User teams for conversations:", filtered.length);
    setUserTeams(filtered);
  }, [teams, user, setUserTeams]);


  const openConversationWith = async (teamId, member, teamName) => {
    try {
      const { data } = await axios.post("/api/chat/conversations", {
        teamId,
        participantId: member._id,
        senderId: user.id
      });
      // data is the conversation
      setActiveConv(data);
      setActiveTeamForConv(teamName);
    } catch (err) {
      console.error("Failed to open conversation", err.response?.data || err.message);
      alert(err.response?.data?.error || "Could not start conversation");
    }
  };


  return (
    <div style={{ padding: 16 }}>
      <h2>Conversations</h2>


      {userTeams.length === 0 ? (
        <p>You are not a member of any team yet. Join or create a team to start chatting with teammates.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {userTeams.map((t) => (
            <div key={t._id} style={{ border: "1px solid #e6e6e6", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{t.description}</div>
                </div>
                <div>
                  <button onClick={() => setSelectedTeam(t)} style={{ background: "#e5e7eb", border: "none", padding: "6px 10px", borderRadius: 6 }}>View Members</button>
                </div>
              </div>


              {selectedTeam && selectedTeam._id === t._id && (
                <div style={{ marginTop: 12 }}>
                  {/* ✅ Show all members (excluding current user) for chatting */}
                  {(t.members || []).filter(m => {
                    const memberId = String(m._id || m);
                    const currentUserId = String(user.id || user._id);
                    return memberId !== currentUserId;
                  }).map((member) => (
                    <div key={member._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, borderBottom: "1px solid #f1f1f1" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{member.username}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{member.email}</div>
                      </div>
                      <div>
                        <button onClick={() => openConversationWith(t._id, member, t.name)} style={{ background: "#5B7FFF", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>💬 Chat</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {activeConv && (
        <Chat
          currentUser={user}
          conversation={activeConv}
          teamName={activeTeamForConv}
          onClose={() => setActiveConv(null)}
        />
      )}
    </div>
  );
}
