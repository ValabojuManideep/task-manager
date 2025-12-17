import React, { useEffect } from "react";
import axios from "axios";
import useAppStore from "../store/useAppStore";
import "./Leaderboard.css";

export default function Leaderboard() {
  const activeTab = useAppStore((s) => s.leaderboard_activeTab);
  const setActiveTab = useAppStore((s) => s.setLeaderboard_activeTab);
  const teamLeaderboard = useAppStore((s) => s.leaderboard_teamLeaderboard);
  const setTeamLeaderboard = useAppStore((s) => s.setLeaderboard_teamLeaderboard);
  const memberLeaderboard = useAppStore((s) => s.leaderboard_memberLeaderboard);
  const setMemberLeaderboard = useAppStore((s) => s.setLeaderboard_memberLeaderboard);
  // team member modal removed; no local state required for per-team members
  const loading = useAppStore((s) => s.leaderboard_loading);
  const setLoading = useAppStore((s) => s.setLeaderboard_loading);
  const error = useAppStore((s) => s.leaderboard_error);
  const setError = useAppStore((s) => s.setLeaderboard_error);
  const currentPage = useAppStore((s) => s.leaderboard_currentPage);
  const setCurrentPage = useAppStore((s) => s.setLeaderboard_currentPage);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  useEffect(() => {
    // reset to first page when switching tabs or when data changes
    setCurrentPage(1);
  }, [activeTab, teamLeaderboard.length, memberLeaderboard.length, setCurrentPage]);

  useEffect(() => {
    // Scroll to leaderboard content when page changes
    const leaderboardContent = document.querySelector('.leaderboard-content');
    if (leaderboardContent) {
      leaderboardContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      const [teamsRes, membersRes] = await Promise.all([
        axios.get("/api/leaderboard/teams"),
        axios.get("/api/leaderboard/members")
      ]);

      setTeamLeaderboard(teamsRes.data);
      setMemberLeaderboard(membersRes.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaderboards:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  // per-team member fetch removed — modal no longer available

  const getPerformanceBadge = (score) => {
    if (score >= 80) return "🏆 Elite";
    if (score >= 60) return "⭐ Expert";
    if (score >= 40) return "🌟 Proficient";
    return "📈 Developing";
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#5B7FFF";
  };

  const formatHours = (hours) => {
    if (hours < 1) return "< 1 hour";
    if (hours === 1) return "1 hour";
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  if (loading && teamLeaderboard.length === 0 && memberLeaderboard.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">🏅 Performance Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Track team and member performance metrics
        </p>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Tab Navigation */}
      <div className="leaderboard-tabs">
        <button
          className={`tab-button ${activeTab === "teams" ? "active" : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          👥 Teams
        </button>
        <button
          className={`tab-button ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          👤 Members
        </button>
      </div>

      {/* Team Leaderboard Tab */}
      {activeTab === "teams" && (
        <div className="leaderboard-content">
          <div className="leaderboard-list">
            {teamLeaderboard.length === 0 ? (
              <div className="empty-state">
                <p>No team data available</p>
              </div>
            ) : (
              (() => {
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paged = teamLeaderboard.slice(start, end);

                return paged.map((team, idx) => (
                  <div key={team.teamId} className="leaderboard-item">
                    <div className="item-rank">
                      <span
                        className="rank-number"
                        style={{ color: getRankColor(start + idx + 1) }}
                      >
                        #{start + idx + 1}
                      </span>
                    </div>

                    <div className="item-content">
                      <div className="item-header">
                        <h3 className="item-title">{team.teamName}</h3>
                        <span className="performance-badge">
                          {getPerformanceBadge(team.performanceScore)}
                        </span>
                      </div>

                      {team.description && (
                        <p className="item-description">{team.description}</p>
                      )}

                      <div className="metrics-grid">
                        <div className="metric">
                          <span className="metric-label">Performance Score</span>
                          <span className="metric-value score">
                            {team.performanceScore}%
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">Completion Rate</span>
                          <span className="metric-value">
                            {team.completionRate}%
                          </span>
                          <span className="metric-detail">
                            ({team.completedTasks}/{team.totalTasks})
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">On-Time Rate</span>
                          <span className="metric-value">
                            {team.onTimeRate}%
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">Avg Completion Time</span>
                          <span className="metric-value">
                            {formatHours(team.avgCompletionTime)}
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">High Priority</span>
                          <span className="metric-value">
                            {team.highPriorityCompleted}/{team.highPriorityTasks}
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">Team Members</span>
                          <span className="metric-value">{team.memberCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* View Members removed per request */}
                  </div>
                ));
              })()
            )}
          </div>

          {/* Pagination Controls for Teams */}
          {teamLeaderboard.length > itemsPerPage && (
            <div className="pagination">
              <button
                type="button"
                className="pagination-button prev"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                }}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <div className="pagination-info">
                Page {currentPage} of {Math.max(1, Math.ceil(teamLeaderboard.length / itemsPerPage))}
              </div>
              <button
                type="button"
                className="pagination-button next"
                onClick={() => {
                  const totalPages = Math.ceil(teamLeaderboard.length / itemsPerPage);
                  const newPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newPage);
                }}
                disabled={currentPage === Math.ceil(teamLeaderboard.length / itemsPerPage)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Member Leaderboard Tab */}
      {activeTab === "members" && (
        <div className="leaderboard-content">
          <div className="leaderboard-list">
            {memberLeaderboard.length === 0 ? (
              <div className="empty-state">
                <p>No member data available</p>
              </div>
            ) : (
              (() => {
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paged = memberLeaderboard.slice(start, end);

                return paged.map((member, idx) => (
                  <div key={member.userId} className="leaderboard-item">
                    <div className="item-rank">
                      <span
                        className="rank-number"
                        style={{ color: getRankColor(start + idx + 1) }}
                      >
                        #{start + idx + 1}
                      </span>
                    </div>

                    <div className="item-content">
                      <div className="item-header">
                        <div>
                          <h3 className="item-title">{member.username}</h3>
                          <p className="item-email">{member.email}</p>
                        </div>
                        <span className="performance-badge">
                          {getPerformanceBadge(member.performanceScore)}
                        </span>
                      </div>

                      <div className="metrics-grid">
                        <div className="metric">
                          <span className="metric-label">Performance Score</span>
                          <span className="metric-value score">
                            {member.performanceScore}%
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">Completion Rate</span>
                          <span className="metric-value">
                            {member.completionRate}%
                          </span>
                          <span className="metric-detail">
                            ({member.completedTasks}/{member.totalTasks})
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">On-Time Rate</span>
                          <span className="metric-value">
                            {member.onTimeRate}%
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">Avg Completion Time</span>
                          <span className="metric-value">
                            {formatHours(member.avgCompletionTime)}
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">In Progress</span>
                          <span className="metric-value metric-pending">
                            {member.inProgressTasks}
                          </span>
                        </div>

                        <div className="metric">
                          <span className="metric-label">High Priority</span>
                          <span className="metric-value">
                            {member.highPriorityCompleted}/{member.highPriorityTasks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()
            )}
          </div>

          {/* Pagination Controls for Members */}
          {memberLeaderboard.length > itemsPerPage && (
            <div className="pagination">
              <button
                type="button"
                className="pagination-button prev"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                }}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <div className="pagination-info">
                Page {currentPage} of {Math.max(1, Math.ceil(memberLeaderboard.length / itemsPerPage))}
              </div>
              <button
                type="button"
                className="pagination-button next"
                onClick={() => {
                  const totalPages = Math.ceil(memberLeaderboard.length / itemsPerPage);
                  const newPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newPage);
                }}
                disabled={currentPage === Math.ceil(memberLeaderboard.length / itemsPerPage)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Team members modal removed per request */}
    </div>
  );
}
