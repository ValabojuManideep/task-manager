import React, { useState, useContext, useEffect } from "react";
import { TeamContext } from "../context/TeamContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./TeamManagement.css";

export default function TeamManagement() {
  const { teams, addTeam, updateTeam, deleteTeam } = useContext(TeamContext);
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/auth/users");
      setUsers(data.filter(u => u.role === "user"));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      alert("⚠️ Please select at least one team member");
      return;
    }

    const teamData = {
      ...form,
      members: selectedUsers,
      createdBy: user.id
    };

    if (editingTeam) {
      await updateTeam(editingTeam._id, teamData);
    } else {
      await addTeam(teamData);
    }

    resetForm();
  };

  const handleEditTeam = (team, e) => {
    e.stopPropagation();
    setEditingTeam(team);
    setForm({
      name: team.name,
      description: team.description || ""
    });
    setSelectedUsers(team.members.map(m => m._id));
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setSelectedUsers([]);
    setSearchTerm("");
    setShowForm(false);
    setEditingTeam(null);
  };

  const handleDeleteTeam = async (teamId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this team?")) {
      await deleteTeam(teamId);
    }
  };

  const handleTeamCardClick = (team) => {
    setSelectedTeamDetail(team);
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    team.members?.some(member => 
      member.username.toLowerCase().includes(teamSearchTerm.toLowerCase())
    )
  );

  return (
    <div className="team-management-container">
      <div className="team-header">
        <h1 className="page-title">Team Management</h1>
        <button 
          className="new-team-btn" 
          onClick={() => {
            if (showForm && editingTeam) {
              resetForm();
            } else {
              setShowForm(!showForm);
            }
          }}
        >
          {showForm ? "✕ Cancel" : "+ Create Team"}
        </button>
      </div>

      {/* Team Search Box */}
      <div className="team-search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="team-search-input"
            placeholder="Search teams by name, description, or member..."
            value={teamSearchTerm}
            onChange={(e) => setTeamSearchTerm(e.target.value)}
          />
          {teamSearchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setTeamSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>
        {teamSearchTerm && (
          <p className="search-results-count">
            Found {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {showForm && (
        <div className="team-form-wrapper">
          <form className="team-form" onSubmit={handleSubmit}>
            <h3>{editingTeam ? "Edit Team" : "Create New Team"}</h3>
            
            <div className="form-group">
              <label>Team Name</label>
              <input
                type="text"
                placeholder="Enter team name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Enter team description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Select Team Members</label>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="user-dropdown">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <div 
                      key={u._id} 
                      className={`user-item ${selectedUsers.includes(u._id) ? 'selected' : ''}`}
                      onClick={() => handleUserToggle(u._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="user-details">
                        <span className="user-name">{u.username}</span>
                        <span className="user-email">{u.email}</span>
                      </div>
                      {selectedUsers.includes(u._id) && (
                        <span className="check-icon">✓</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-users">No users found</div>
                )}
              </div>

              <div className="selected-count">
                {selectedUsers.length} member(s) selected
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={selectedUsers.length === 0}
              >
                {editingTeam ? "Update Team" : "Create Team"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="teams-list">
        {filteredTeams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{teamSearchTerm ? "No teams found" : "No teams yet"}</h3>
            <p>
              {teamSearchTerm 
                ? "Try adjusting your search criteria" 
                : "Create your first team to get started"}
            </p>
          </div>
        ) : (
          filteredTeams.map(team => (
            <div 
              key={team._id} 
              className="team-card"
              onClick={() => handleTeamCardClick(team)}
            >
              <div className="team-card-header">
                <h3>{team.name}</h3>
                <div className="team-actions">
                  <button 
                    className="edit-team-btn"
                    onClick={(e) => handleEditTeam(team, e)}
                    title="Edit team"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-team-btn"
                    onClick={(e) => handleDeleteTeam(team._id, e)}
                    title="Delete team"
                  >
                    🗑
                  </button>
                </div>
              </div>
              {team.description && (
                <div className="team-description-preview">
                  <p className="team-description">
                    {team.description.length > 80 
                      ? `${team.description.substring(0, 80)}...` 
                      : team.description}
                  </p>
                </div>
              )}
              <div className="team-members">
                <strong>Members ({team.members?.length || 0}):</strong>
                <div className="members-list">
                  {team.members?.slice(0, 3).map(member => (
                    <span key={member._id} className="member-tag">
                      {member.username}
                    </span>
                  ))}
                  {team.members?.length > 3 && (
                    <span className="member-tag more-members">
                      +{team.members.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeamDetail && (
        <div className="team-detail-modal-overlay" onClick={() => setSelectedTeamDetail(null)}>
          <div className="team-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTeamDetail.name}</h2>
              <button className="close-modal-btn" onClick={() => setSelectedTeamDetail(null)}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              {selectedTeamDetail.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="detail-description">{selectedTeamDetail.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Team Members ({selectedTeamDetail.members?.length || 0})</h4>
                <div className="detail-members-grid">
                  {selectedTeamDetail.members?.map(member => (
                    <div key={member._id} className="detail-member-card">
                      <div className="member-avatar">
                        {member.username?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <div className="member-name-detail">{member.username}</div>
                        <div className="member-email-detail">{member.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Team Information</h4>
                <div className="team-meta">
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">
                      {new Date(selectedTeamDetail.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created by:</span>
                    <span className="meta-value">
                      {selectedTeamDetail.createdBy?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="modal-edit-btn"
                onClick={(e) => {
                  setSelectedTeamDetail(null);
                  handleEditTeam(selectedTeamDetail, e);
                }}
              >
                ✏️ Edit Team
              </button>
              <button 
                className="modal-delete-btn"
                onClick={(e) => {
                  setSelectedTeamDetail(null);
                  handleDeleteTeam(selectedTeamDetail._id, e);
                }}
              >
                🗑 Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
