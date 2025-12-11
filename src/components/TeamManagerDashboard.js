import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import axios from "axios";
import toast from "react-hot-toast";
import { useConfirm } from "../hooks/useConfirm";
import "./TeamManagerDashboard.css";

const TeamManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirmAction } = useConfirm();
  
  const teams = useAppStore((s) => s.teams);
  const setTeams = useAppStore((s) => s.setTeams);
  const managedTeams = useAppStore((s) => s.managedTeams);
  const setManagedTeams = useAppStore((s) => s.setManagedTeams);
  const selectedTeam = useAppStore((s) => s.selectedTeam);
  const setSelectedTeam = useAppStore((s) => s.setSelectedTeam);
  const teamTasks = useAppStore((s) => s.teamTasks);
  const setTeamTasks = useAppStore((s) => s.setTeamTasks);
  const loading = useAppStore((s) => s.teamManagerLoading);
  const setLoading = useAppStore((s) => s.setTeamManagerLoading);
  const error = useAppStore((s) => s.teamManagerError);
  const setError = useAppStore((s) => s.setTeamManagerError);

  // State for member management
  const [showTeamDetail, setShowTeamDetail] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    // Filter teams where current user is a team manager
    const myTeams = teams.filter(team => 
      team.teamManagers?.some(manager => 
        String(manager._id || manager) === String(user?.id || user?._id)
      )
    );
    setManagedTeams(myTeams);
  }, [teams, user, setManagedTeams]);

  // Fetch all users for adding members
  // Fetch all users for adding members
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📡 Fetching all users...");
      
      // ✅ Try multiple endpoints
      let data;
      try {
        const response = await axios.get("http://localhost:5000/api/auth/all-users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        data = response.data;
      } catch (err) {
        // If /all-users doesn't exist, try /users
        console.log("⚠️ /all-users not found, trying /users");
        const response = await axios.get("http://localhost:5000/api/auth/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        data = response.data;
      }
      
      console.log("✅ Users fetched:", data.length);
      console.log("Users:", data.map(u => ({ username: u.username, role: u.role })));
      setAllUsers(data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      console.error("Error details:", err.response?.data);
      toast.error("Failed to fetch users");
    }
  };
  fetchUsers();
}, []);


  const getTeamTasks = async (teamId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `http://localhost:5000/api/teams/${teamId}/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return data;
    } catch (err) {
      console.error("Error fetching team tasks:", err);
      throw err;
    }
  };

  const loadTeamTasks = async (teamId) => {
    setLoading(true);
    setError(null);
    try {
      const tasks = await getTeamTasks(teamId);
      setTeamTasks(tasks || []);
      setSelectedTeam(teamId);
    } catch (err) {
      setError("Failed to load team tasks");
      console.error("Error loading team tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTasks = (team, e) => {
    e.stopPropagation();
    console.log("📋 Viewing tasks for team:", team.name);
    navigate("/tasks/team");
  };

  // Show team detail modal
  const handleManageTeam = (team, e) => {
    e.stopPropagation();
    console.log("👥 Managing team:", team.name);
    setShowTeamDetail(team);
    setShowAddMemberModal(false);
    setMemberSearchTerm("");
  };

  // Add member to team
  const handleAddMember = async (teamId, userId) => {
    try {
      const token = localStorage.getItem("token");
      console.log("➕ Adding member:", userId, "to team:", teamId);
      
      const { data } = await axios.post(
        `http://localhost:5000/api/teams/${teamId}/members`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Member added successfully:", data);

      // Update teams in store
      const updatedTeams = teams.map(t => (t._id === teamId ? data.team : t));
      setTeams(updatedTeams);

      // Update showTeamDetail if it's the current team
      if (showTeamDetail?._id === teamId) {
        setShowTeamDetail(data.team);
      }

      toast.success("Member added successfully!");
      setShowAddMemberModal(false);
      setMemberSearchTerm("");
    } catch (err) {
      console.error("❌ Error adding member:", err);
      toast.error(err.response?.data?.error || "Failed to add member");
    }
  };

  // Remove member from team
  const handleRemoveMember = async (teamId, memberId, memberName) => {
    const confirmed = await confirmAction(
      "Remove Member?",
      `Are you sure you want to remove ${memberName} from this team?`,
      "warning",
      "Remove",
      "#ef4444"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      console.log("➖ Removing member:", memberId, "from team:", teamId);
      
      const { data } = await axios.delete(
        `http://localhost:5000/api/teams/${teamId}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Member removed successfully:", data);

      // Update teams in store
      const updatedTeams = teams.map(t => (t._id === teamId ? data.team : t));
      setTeams(updatedTeams);

      // Update showTeamDetail if it's the current team
      if (showTeamDetail?._id === teamId) {
        setShowTeamDetail(data.team);
      }

      toast.success("Member removed successfully!");
    } catch (err) {
      console.error("❌ Error removing member:", err);
      toast.error(err.response?.data?.error || "Failed to remove member");
    }
  };

  // ✅ FIXED: Get available users to add (not already members)
  const availableUsers = allUsers.filter(u => {
    if (!showTeamDetail) return false;
    
    // Allow both regular users AND team-managers to be added (exclude only admins)
    if (u.role === "admin") return false;
    
    const currentMemberIds = (showTeamDetail.members || []).map(m => String(m._id || m));
    const isAlreadyMember = currentMemberIds.includes(String(u._id));
    
    const matchesSearch = 
      u.username.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearchTerm.toLowerCase());
    
    return !isAlreadyMember && matchesSearch;
  });

  // Debug logs
  console.log("🔍 Add Member Modal Debug:");
  console.log("Total users fetched:", allUsers.length);
  console.log("Current team members:", showTeamDetail?.members?.length || 0);
  console.log("Available users to add:", availableUsers.length);
  console.log("Search term:", memberSearchTerm);
  if (availableUsers.length > 0) {
    console.log("Available users:", availableUsers.map(u => ({ username: u.username, role: u.role })));
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'done': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="team-manager-dashboard">
      <div className="dashboard-header">
        <h1>Team Manager Dashboard</h1>
        <p className="subtitle">Manage your teams and tasks</p>
      </div>

      {managedTeams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Teams to Manage</h3>
          <p>You haven't been assigned as a manager for any teams yet.</p>
        </div>
      ) : (
        <>
          <div className="managed-teams-section">
            <h2>Your Managed Teams ({managedTeams.length})</h2>
            <div className="teams-grid">
              {managedTeams.map(team => (
                <div 
                  key={team._id} 
                  className={`team-card ${selectedTeam === team._id ? 'active' : ''}`}
                  onClick={() => loadTeamTasks(team._id)}
                >
                  <div className="team-card-header">
                    <h3>{team.name}</h3>
                    <span className="member-count">
                      {team.members?.length || 0} members
                    </span>
                  </div>
                  {team.description && (
                    <p className="team-description">{team.description}</p>
                  )}
                  
                  <div className="team-card-actions">
                    <button 
                      className="manage-team-btn"
                      onClick={(e) => handleManageTeam(team, e)}
                    >
                      👥 Manage Members
                    </button>
                    <button 
                      className="view-tasks-btn"
                      onClick={(e) => handleViewTasks(team, e)}
                    >
                      View Tasks →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTeam && (
            <div className="team-tasks-section">
              <h2>Team Tasks</h2>
              
              {loading ? (
                <div className="loading-state">Loading tasks...</div>
              ) : error ? (
                <div className="error-state">{error}</div>
              ) : teamTasks.length === 0 ? (
                <div className="empty-tasks">
                  <p>No tasks found for this team</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {teamTasks.map(task => (
                    <div key={task._id} className="task-card">
                      <div className="task-header">
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-badges">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(task.status) }}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                      
                      {task.dueDate && (
                        <div className="task-due-date">
                          📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      {task.assignedTo && (
                        <div className="task-assignee">
                          👤 Assigned to: {task.assignedTo.username}
                        </div>
                      )}
                      
                      <div className="task-comments">
                        💬 {task.comments?.length || 0} comments
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Team Detail Modal */}
      {showTeamDetail && (
        <div className="team-detail-modal-overlay" onClick={() => setShowTeamDetail(null)}>
          <div className="team-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Team: {showTeamDetail.name}</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowTeamDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {showTeamDetail.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="detail-description">{showTeamDetail.description}</p>
                </div>
              )}

              {/* Team Managers */}
              {showTeamDetail.teamManagers && showTeamDetail.teamManagers.length > 0 && (
                <div className="detail-section">
                  <h4>Team Managers ({showTeamDetail.teamManagers.length})</h4>
                  <div className="detail-members-grid">
                    {showTeamDetail.teamManagers.map(manager => (
                      <div key={manager._id} className="detail-member-card manager-card">
                        <div className="member-avatar manager-avatar">
                          {manager.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <div className="member-name-detail">{manager.username}</div>
                          <div className="member-email-detail">{manager.email}</div>
                          <span className="role-badge-detail">Team Manager</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Members */}
              <div className="detail-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4>Team Members ({showTeamDetail.members?.length || 0})</h4>
                  <button
                    className="add-member-btn"
                    onClick={() => setShowAddMemberModal(true)}
                    style={{
                      background: "#5B7FFF",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9em",
                      fontWeight: "600"
                    }}
                  >
                    + Add Member
                  </button>
                </div>

                {showTeamDetail.members && showTeamDetail.members.length > 0 ? (
                  <div className="detail-members-grid">
                    {showTeamDetail.members.map(member => (
                      <div key={member._id} className="detail-member-card">
                        <div className="member-avatar">
                          {member.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <div className="member-name-detail">{member.username}</div>
                          <div className="member-email-detail">{member.email}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(showTeamDetail._id, member._id, member.username)}
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85em"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    No members in this team yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && showTeamDetail && (
        <div className="team-detail-modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div 
            className="team-detail-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="modal-header">
              <h2>Add Member to {showTeamDetail?.name}</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowAddMemberModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search users..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                style={{ 
                  marginBottom: "16px", 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
              />

              <div className="user-dropdown" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {availableUsers.length > 0 ? (
                  availableUsers.map(u => (
                    <div
                      key={u._id}
                      className="user-item"
                      onClick={() => handleAddMember(showTeamDetail._id, u._id)}
                      style={{ 
                        cursor: "pointer", 
                        padding: "12px", 
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div className="user-details">
                        <div style={{ fontWeight: "600", marginBottom: "4px" }}>{u.username}</div>
                        <div style={{ fontSize: "0.85em", color: "#666" }}>{u.email}</div>
                        <span style={{ 
                          display: "inline-block",
                          marginTop: "4px",
                          padding: "2px 8px",
                          background: u.role === "team-manager" ? "#10b981" : "#5B7FFF",
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "0.75em",
                          fontWeight: "600"
                        }}>
                          {u.role === "team-manager" ? "Team Manager" : "User"}
                        </span>
                      </div>
                      <span style={{ color: "#5B7FFF", fontWeight: "bold", fontSize: "1.5em" }}>+</span>
                    </div>
                  ))
                ) : (
                  <div className="no-users" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    {memberSearchTerm ? "No users found matching your search" : "No available users to add"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagerDashboard;
