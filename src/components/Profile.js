import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { format } from "date-fns";
import useAppStore from "../store/useAppStore";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const profile = useAppStore((s) => s.profile_profile);
  const setProfile = useAppStore((s) => s.setProfile_profile);
  const loading = useAppStore((s) => s.profile_loading);
  const setLoading = useAppStore((s) => s.setProfile_loading);
  const error = useAppStore((s) => s.profile_error);
  const setError = useAppStore((s) => s.setProfile_error);
  const mentions = useAppStore((s) => s.profile_mentions);
  const setMentions = useAppStore((s) => s.setProfile_mentions);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = user?.id || user?._id;
        if (userId) {
          const { data } = await axios.get(`/api/users/${userId}`);
          setProfile(data);
        } else {
          setProfile(user);
        }
      } catch (err) {
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    async function fetchMentions() {
      if (!user?.username) return;
      try {
        const { data: tasks } = await axios.get("/api/tasks");
        const recentMentions = [];

        for (const task of tasks) {
          if (!task.comments) continue;
          for (const comment of task.comments) {
            if (comment.text && comment.text.includes(`@${user.username}`)) {
              recentMentions.push({
                taskTitle: task.title,
                taskId: task._id,
                commentText: comment.text,
                commentUser: comment.username,
                commentDate: comment.createdAt,
              });
            }
          }
        }

        recentMentions.sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate));
        setMentions(recentMentions.slice(0, 10));
      } catch (err) {
        setMentions([]);
      }
    }
    fetchMentions();
  }, [user]);

  if (loading) return <div className="profile-page">Loading profile...</div>;
  if (!profile) return <div className="profile-page">No profile available</div>;

  const renderJoinedDate = () => {
    if (profile.createdAt) return format(new Date(profile.createdAt), "PPpp");

    const id = profile._id || profile.id;
    if (id && typeof id === "string" && id.length >= 8) {
      try {
        const ts = parseInt(id.substring(0, 8), 16) * 1000;
        return format(new Date(ts), "PPpp") + " (from id)";
      } catch (e) {
        return "-";
      }
    }
    return "-";
  };

  return (
    <div className="profile-page" style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
      <div className="profile-card" style={{ flex: "1 1 340px", maxWidth: "400px" }}>
        <div className="profile-header">
          <div className="avatar">{(profile.username || "U").substring(0, 2).toUpperCase()}</div>
          <div className="profile-title">
            <h2>{profile.username}</h2>
            <div className="profile-role">{profile.role || "user"}</div>
          </div>
        </div>
        <div className="profile-body">
          <div className="profile-row">
            <div className="label">Email</div>
            <div className="value">{profile.email || "-"}</div>
          </div>
          <div className="profile-row">
            <div className="label">User ID</div>
            <div className="value">{profile._id || profile.id || "-"}</div>
          </div>
          <div className="profile-row">
            <div className="label">Role</div>
            <div className="value">{profile.role || "-"}</div>
          </div>
          <div className="profile-row">
            <div className="label">Joined</div>
            <div className="value">{renderJoinedDate()}</div>
          </div>
          {Object.keys(profile)
            .filter(
              (k) =>
                !["_id", "id", "username", "email", "role", "createdAt", "password"].includes(k)
            )
            .map((key) => (
              <div className="profile-row" key={key}>
                <div className="label">{key}</div>
                <div className="value">{String(profile[key])}</div>
              </div>
            ))}
        </div>
      </div>
      <div className="profile-mentions" style={{ flex: "2 1 340px", maxWidth: "600px" }}>
        <h3 style={{ marginTop: "0", marginBottom: "1rem", color: "#5B7FFF" }}>Recent Mentions</h3>
        {mentions.length === 0 ? (
          <div style={{ color: "#888", fontStyle: "italic" }}>No recent mentions.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {mentions.map((m, idx) => (
              <div key={idx} className="mention-card">
                <div className="mention-task-title">{m.taskTitle}</div>
                <div className="mention-body">
                  <span className="mention-user">@{m.commentUser}</span>: {" "}
                  {m.commentText.split(`@${profile.username}`).map((part, i, arr) =>
                    i < arr.length - 1 ? (
                      <React.Fragment key={i}>
                        <span>{part}</span>
                        <span className="mention-highlight">@{profile.username}</span>
                      </React.Fragment>
                    ) : (
                      part
                    )
                  )}
                </div>
                <div className="mention-date">{format(new Date(m.commentDate), "PPpp")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}