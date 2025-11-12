import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch fresh data from backend if we have an id
        const userId = user?.id || user?._id;
        if (userId) {
          const { data } = await axios.get(`http://localhost:5000/api/users/${userId}`);
          console.debug('Profile fetch response:', data);
          setProfile(data);
        } else {
          // Fall back to the stored user object
          setProfile(user);
        }
      } catch (err) {
        // If backend call fails, fallback to local user object
        console.error("Error fetching profile:", err);
        // keep console errors for debugging, but show stored user data if available
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) return <div className="profile-page">Loading profile...</div>;
  if (!profile) return <div className="profile-page">No profile available</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">{(profile.username || "U").substring(0,2).toUpperCase()}</div>
          <div className="profile-title">
            <h2>{profile.username}</h2>
            <div className="profile-role">{profile.role || "user"}</div>
          </div>
        </div>

  {/* Do not show detailed backend errors to the user; keep for console logs */}

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
            <div className="value">
              {(() => {
                // show createdAt if present; otherwise derive from Mongo ObjectId timestamp
                if (profile.createdAt) return format(new Date(profile.createdAt), "PPpp");
                const id = profile._id || profile.id;
                if (id && typeof id === 'string' && id.length >= 8) {
                  try {
                    const ts = parseInt(id.substring(0, 8), 16) * 1000;
                    return format(new Date(ts), "PPpp") + ' (from id)';
                  } catch (e) {
                    return '-';
                  }
                }
                return '-';
              })()}
            </div>
          </div>

          {/* Show any other fields that might exist on the object */}
          {Object.keys(profile)
            .filter((k) => !["_id", "id", "username", "email", "role", "createdAt", "password"].includes(k))
            .map((key) => (
              <div className="profile-row" key={key}>
                <div className="label">{key}</div>
                <div className="value">{String(profile[key])}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
