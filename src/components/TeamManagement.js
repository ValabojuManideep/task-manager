import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import useAppStore from "../store/useAppStore";
import "./TeamManagement.css";
import Chat from "./Chat";

export default function TeamManagement() {
  const teams = useAppStore((s) => s.teams);
  const { user, isAdmin } = useAuth();

  const showForm = useAppStore((s) => s.teamMgmt_showForm);
  const setShowForm = useAppStore((s) => s.setTeamMgmt_showForm);
  const editingTeam = useAppStore((s) => s.teamMgmt_editingTeam);
  const setEditingTeam = useAppStore((s) => s.setTeamMgmt_editingTeam);
  const selectedTeamDetail = useAppStore((s) => s.teamMgmt_selectedTeamDetail);
  const setSelectedTeamDetail = useAppStore((s) => s.setTeamMgmt_selectedTeamDetail);
  const showChatModal = useAppStore((s) => s.teamMgmt_showChatModal);
  const setShowChatModal = useAppStore((s) => s.setTeamMgmt_showChatModal);
  const chatTarget = useAppStore((s) => s.teamMgmt_chatTarget);
  const setChatTarget = useAppStore((s) => s.setTeamMgmt_chatTarget);
  const users = useAppStore((s) => s.teamMgmt_users);
  const setUsers = useAppStore((s) => s.setTeamMgmt_users);
  const selectedUsers = useAppStore((s) => s.teamMgmt_selectedUsers);
  const setSelectedUsers = useAppStore((s) => s.setTeamMgmt_selectedUsers);
  const selectedManagers = useAppStore((s) => s.teamMgmt_selectedManagers);
  const setSelectedManagers = useAppStore((s) => s.setTeamMgmt_selectedManagers);
  const searchTerm = useAppStore((s) => s.teamMgmt_searchTerm);
  const setSearchTerm = useAppStore((s) => s.setTeamMgmt_searchTerm);
  const managerSearchTerm = useAppStore((s) => s.teamMgmt_managerSearchTerm);
  const setManagerSearchTerm = useAppStore((s) => s.setTeamMgmt_managerSearchTerm);
  const teamSearchTerm = useAppStore((s) => s.teamMgmt_teamSearchTerm);
  const setTeamSearchTerm = useAppStore((s) => s.setTeamMgmt_teamSearchTerm);
  const form = useAppStore((s) => s.teamMgmt_form);
  const setForm = useAppStore((s) => s.setTeamMgmt_form);

  const page = useAppStore((s) => s.teamMgmt_page);
  const setPage = useAppStore((s) => s.setTeamMgmt_page);
  const pageSize = 9;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/auth/all-users",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Fetched users:", data);
      console.log("Team managers:", data.filter(u => u.role === "team-manager"));
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const addTeam = async (team) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/teams", team);
      const updatedTeams = [...teams, data];
      useAppStore.setState({ teams: updatedTeams });
      return data;
    } catch (err) {
      console.error("Error adding team:", err);
      throw err;
    }
  };

  const updateTeam = async (id, updates) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/teams/${id}`, updates);
      const updatedTeams = teams.map(t => t._id === id ? data : t);
      useAppStore.setState({ teams: updatedTeams });
      return data;
    } catch (err) {
      console.error("Error updating team:", err);
      throw err;
    }
  };

  const deleteTeam = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/teams/${id}`);
      const updatedTeams = teams.filter(t => t._id !== id);
      useAppStore.setState({ teams: updatedTeams });
    } catch (err) {
      console.error("Error deleting team:", err);
      throw err;
    }
  };

  // Rest of your code remains the same...







  // ✅ NEW: Separate users by role
  const regularUsers = users.filter((u) => u.role === "user");
  const teamManagerUsers = users.filter((u) => u.role === "team-manager");

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // ✅ NEW: Handle team manager toggle
  const handleManagerToggle = (userId) => {
    setSelectedManagers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedUsers.length < 2) {
      alert("A team must have at least 2 members.");
      return;
    }

    const normalizedName = form.name.trim().toLowerCase();
    const duplicate = teams.some(
      (t) =>
        t.name.trim().toLowerCase() === normalizedName &&
        (!editingTeam || t._id !== editingTeam._id)
    );

    if (duplicate) {
      alert("A team with this name already exists.");
      return;
    }

    const teamData = {
      ...form,
      members: selectedUsers,
      teamManagers: selectedManagers, // ✅ NEW
      createdBy: user.id
    };

    try {
      if (editingTeam) {
        await updateTeam(editingTeam._id, teamData);
      } else {
        await addTeam(teamData);
      }
      resetForm();
    } catch (err) {
      console.error("Error saving team:", err);
      alert("Failed to save team. Please try again.");
    }
  };

  const handleEditTeam = (team, e) => {
    e.stopPropagation();
    setEditingTeam(team);
    setForm({
      name: team.name,
      description: team.description || ""
    });
    setSelectedUsers(team.members.map((m) => m._id));
    setSelectedManagers(team.teamManagers?.map((m) => m._id) || []); // ✅ NEW
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setSelectedUsers([]);
    setSelectedManagers([]); // ✅ NEW
    setSearchTerm("");
    setManagerSearchTerm(""); // ✅ NEW
    setShowForm(false);
    setEditingTeam(null);
  };

  const handleDeleteTeam = async (teamId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await deleteTeam(teamId);
      } catch (err) {
        console.error("Error deleting team:", err);
        alert("Failed to delete team. Please try again.");
      }
    }
  };

  const handleTeamCardClick = (team) => {
    setSelectedTeamDetail(team);
  };

  const filteredUsers = regularUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ NEW: Filter team managers
  const filteredManagers = teamManagerUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(managerSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(managerSearchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
      team.members?.some((member) =>
        member.username.toLowerCase().includes(teamSearchTerm.toLowerCase())
      )
  );

  const totalPages = Math.ceil(filteredTeams.length / pageSize);
  const paginatedTeams = filteredTeams.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="team-management-container">
      <div className="team-header">
        <h1 className="page-title">Team Management</h1>
        {isAdmin && (
          <button
            className="new-team-btn"
            onClick={() => {
              if (showForm && editingTeam) resetForm();
              else setShowForm(!showForm);
            }}
          >
            {showForm ? "✕ Cancel" : "+ Create Team"}
          </button>
        )}
      </div>

      {/* Search box */}
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
            Found {filteredTeams.length} team
            {filteredTeams.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Form UI */}
      {showForm && isAdmin && (
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
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows="2"
              />
            </div>

            {/* ✅ NEW: Team Managers Section */}
            <div className="form-group">
              <label>Select Team Managers (Optional)</label>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search team managers..."
                value={managerSearchTerm}
                onChange={(e) => setManagerSearchTerm(e.target.value)}
              />

              <div className="user-dropdown">
                {filteredManagers.length > 0 ? (
                  filteredManagers.map((u) => (
                    <div
                      key={u._id}
                      className={`user-item ${
                        selectedManagers.includes(u._id) ? "selected" : ""
                      }`}
                      onClick={() => handleManagerToggle(u._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedManagers.includes(u._id)}
                        onClick={(e) => e.stopPropagation()}
                        readOnly
                      />

                      <div className="user-details">
                        <span className="user-name">{u.username}</span>
                        <span className="user-email">{u.email}</span>
                        <span className="user-role-badge">👔 Team Manager</span>
                      </div>

                      {selectedManagers.includes(u._id) && (
                        <span className="check-icon">✓</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-users">No team managers available</div>
                )}
              </div>

              <div className="selected-count">
                {selectedManagers.length} manager(s) selected
              </div>
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
                  filteredUsers.map((u) => (
                    <div
                      key={u._id}
                      className={`user-item ${
                        selectedUsers.includes(u._id) ? "selected" : ""
                      }`}
                      onClick={() => handleUserToggle(u._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onClick={(e) => e.stopPropagation()}
                        readOnly
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

      {/* Team Cards */}
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
          <>
            {paginatedTeams.map((team) => (
              <div
                key={team._id}
                className="team-card"
                onClick={() => handleTeamCardClick(team)}
              >
                <div className="team-card-header">
                  <h3>{team.name}</h3>

                  {isAdmin && (
                    <div className="team-actions">
                      <button
                        className="edit-team-btn"
                        onClick={(e) => handleEditTeam(team, e)}
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-team-btn"
                        onClick={(e) => handleDeleteTeam(team._id, e)}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>

                {team.description && (
                  <div className="team-description-preview">
                    <p>{team.description}</p>
                  </div>
                )}

                {/* ✅ NEW: Show team managers */}
                {team.teamManagers && team.teamManagers.length > 0 && (
                  <div className="team-managers">
                    <strong>Managers ({team.teamManagers.length}):</strong>
                    <div className="managers-list">
                      {team.teamManagers.slice(0, 2).map((manager) => (
                        <span key={manager._id} className="manager-tag">
                          👔 {manager.username}
                        </span>
                      ))}
                      {team.teamManagers.length > 2 && (
                        <span className="manager-tag more-managers">
                          +{team.teamManagers.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="team-members">
                  <strong>Members ({team.members?.length || 0}):</strong>

                  <div className="members-list">
                    {team.members?.slice(0, 3).map((member) => (
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
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1.2rem",
            marginTop: "2rem",
            marginBottom: "2rem"
          }}
        >
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            style={{
              padding: "0.5rem 1.2rem",
              background: page === 1 ? "#e5e7eb" : "#5B7FFF",
              color: page === 1 ? "#6b7280" : "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: page === 1 ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(91,127,255,0.08)"
            }}
          >
            Prev
          </button>

          <span style={{ fontWeight: 600, color: "#5B7FFF" }}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: "0.5rem 1.2rem",
              background: page === totalPages ? "#e5e7eb" : "#5B7FFF",
              color: page === totalPages ? "#6b7280" : "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(91,127,255,0.08)"
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Team Modal */}
      {selectedTeamDetail && (
        <div
          className="team-detail-modal-overlay"
          onClick={() => setSelectedTeamDetail(null)}
        >
          <div
            className="team-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedTeamDetail.name}</h2>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedTeamDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {selectedTeamDetail.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="detail-description">
                    {selectedTeamDetail.description}
                  </p>
                </div>
              )}

              {/* ✅ NEW: Team Managers Section in Modal */}
              {selectedTeamDetail.teamManagers && selectedTeamDetail.teamManagers.length > 0 && (
                <div className="detail-section">
                  <h4>
                    Team Managers ({selectedTeamDetail.teamManagers.length})
                  </h4>
                  <div className="detail-members-grid">
                    {selectedTeamDetail.teamManagers.map((manager) => (
                      <div key={manager._id} className="detail-member-card manager-card">
                        <div className="member-avatar manager-avatar">
                          {manager.username?.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="member-info">
                          <div className="member-name-detail">
                            {manager.username}
                          </div>
                          <div className="member-email-detail">
                            {manager.email}
                          </div>
                          <span className="role-badge-detail">Team Manager</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>
                  Team Members ({selectedTeamDetail.members?.length || 0})
                </h4>
                <div className="detail-members-grid">
                  {selectedTeamDetail.members?.map((member) => (
                    <div key={member._id} className="detail-member-card">
                      <div className="member-avatar">
                        {member.username?.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="member-info">
                        <div className="member-name-detail">
                          {member.username}
                        </div>
                        <div className="member-email-detail">
                          {member.email}
                        </div>
                      </div>

                      <div style={{ marginLeft: 12 }}>
                        <button
                          onClick={() => {
                            setChatTarget(member);
                            setShowChatModal(true);
                          }}
                          style={{
                            background: "#5B7FFF",
                            color: "#fff",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: 6,
                            cursor: "pointer"
                          }}
                        >
                          💬 Chat
                        </button>
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
                      {new Date(
                        selectedTeamDetail.createdAt
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Created by:</span>
                    <span className="meta-value">
                      {selectedTeamDetail.createdBy?.username || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
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
            )}
          </div>
        </div>
      )}
      {showChatModal && chatTarget && (
        <Chat
          teamId={selectedTeamDetail._id}
          otherUser={chatTarget}
          currentUser={user}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}
