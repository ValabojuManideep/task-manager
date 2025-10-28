import React, { useState, useEffect } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import "./Activity.css";

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/activities");
      setActivities(data);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "created": return "➕";
      case "updated": return "✏️";
      case "deleted": return "🗑️";
      default: return "📝";
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case "created": return "#10b981";
      case "updated": return "#5B7FFF";
      case "deleted": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="activity-container">
        <h1 className="page-title">Activity Log</h1>
        <p className="page-subtitle">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="activity-container">
      <div>
        <h1 className="page-title">Activity Log</h1>
        <p className="page-subtitle">Recent actions and updates across all tasks</p>
      </div>

      {activities.length === 0 ? (
        <div className="activity-empty">
          <div className="activity-icon">📈</div>
          <h3>No activity yet</h3>
          <p>Activity will appear here as tasks are created and updated</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activities.map((activity) => (
            <div key={activity._id} className="activity-item">
              <div
                className="activity-badge"
                style={{ backgroundColor: getActivityColor(activity.action) }}
              >
                {getActivityIcon(activity.action)}
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  <span className="activity-action" style={{ color: getActivityColor(activity.action) }}>
                    {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                  </span>
                  <span className="activity-task">"{activity.taskTitle}"</span>
                  {activity.details && <span className="activity-details"> - {activity.details}</span>}
                </div>
                <div className="activity-time">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
