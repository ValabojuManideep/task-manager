import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { format } from "date-fns";
import useAppStore from "../store/useAppStore";
import "./Activity.css";

export default function Activity() {
  const { user } = useAuth();
  const activities = useAppStore((s) => s.activity_activities);
  const setActivities = useAppStore((s) => s.setActivity_activities);
  const loading = useAppStore((s) => s.activity_loading);
  const setLoading = useAppStore((s) => s.setActivity_loading);
  const userFilter = useAppStore((s) => s.activity_userFilter);
  const setUserFilter = useAppStore((s) => s.setActivity_userFilter);
  const users = useAppStore((s) => s.activity_users);
  const setUsers = useAppStore((s) => s.setActivity_users);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchActivities();
    if (isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/auth/users");
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data } = await axios.get("/api/activities");
      
      console.log("Fetched activities:", data);
      
      // Filter activities based on role
      let filtered = data;
      if (!isAdmin) {
        // Regular users see only their own activities
        filtered = data.filter(activity => activity.user === user.username);
      }
      
      setActivities(filtered);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setLoading(false);
    }
  };

  // Filter activities based on user filter (admin only)
  const getFilteredActivities = () => {
    if (!isAdmin || userFilter === "All Users") {
      return activities;
    }

    const selectedUser = users.find(u => u._id === userFilter);
    if (!selectedUser) return activities;

    return activities.filter(activity => activity.user === selectedUser.username);
  };

  const displayActivities = getFilteredActivities();

  const getActionIcon = (action) => {
    switch (action) {
      case "created": return "➕";
      case "updated": return "✏️";
      case "deleted": return "🗑️";
      case "commented": return "💬";
      default: return "📌";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "created": return "#10b981";
      case "updated": return "#5B7FFF";
      case "deleted": return "#ef4444";
      case "commented": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  // Format activity text with proper spacing and role
  const formatActivityText = (activity) => {
    const userName = activity.user || "Unknown";
    const action = activity.action;
    const taskName = activity.task || "";
    
    // Check if username contains "Admin" (case-insensitive)
    const userNameLower = userName.toLowerCase();
    const containsAdmin = userNameLower.includes("admin");
    
    // For delete action, always show "Admin <name>" if user is admin
    if (action === "deleted") {
      const displayName = containsAdmin ? `Admin ${userName}` : userName;
      return `${displayName} deleted ${taskName}`;
    }
    
    // For other actions, just use the username as-is
    if (action === "commented") {
      return `${userName} commented on ${taskName}`;
    } else if (action === "updated") {
      return `${userName} updated ${taskName}`;
    } else if (action === "created") {
      return `${userName} created ${taskName}`;
    }
    
    return `${userName} ${action} ${taskName}`;
  };

  if (loading) {
    return (
      <div className="activity-container">
        <h1 className="page-title">Activity Log</h1>
        <p className="loading-text">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="activity-container">
      <div className="activity-header-section">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">
            {isAdmin ? "Track all actions and changes in the system" : "Track your activity history"}
          </p>
        </div>
        
        {isAdmin && users.length > 0 && (
          <select 
            className="activity-user-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="All Users">All Users</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.username}
              </option>
            ))}
          </select>
        )}
      </div>

      {displayActivities.length === 0 ? (
        <div className="empty-activity">
          <div className="empty-icon">📋</div>
          <h3>No activity yet</h3>
          <p>{isAdmin ? "Create a task or update status to see activities" : "Your activities will appear here"}</p>
        </div>
      ) : (
        <div className="activity-list">
          {displayActivities.map((activity) => (
            <div key={activity._id} className="activity-item">
              <div 
                className="activity-icon" 
                style={{ backgroundColor: getActionColor(activity.action) }}
              >
                {getActionIcon(activity.action)}
              </div>
              <div className="activity-content">
                <div className="activity-main-text">
                  {formatActivityText(activity)}
                </div>
                {activity.details && (
                  <p className="activity-details">{activity.details}</p>
                )}
                <span className="activity-time">
                  {format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
