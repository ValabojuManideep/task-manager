import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import axios from "axios";
import "./TeamManagerDashboard.css";

const TeamManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const teams = useAppStore((s) => s.teams);
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

  useEffect(() => {
    // Filter teams where current user is a team manager
    const myTeams = teams.filter(team => 
      team.teamManagers?.some(manager => 
        String(manager._id || manager) === String(user?.id || user?._id)
      )
    );
    setManagedTeams(myTeams);
  }, [teams, user]);

  // ✅ FIX: Add the missing getTeamTasks function
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

  // ✅ Alternative: Navigate to Team Tasks page
  const handleViewTasks = (team, e) => {
    e.stopPropagation(); // Prevent card click
    console.log("📋 Viewing tasks for team:", team.name);
    navigate("/tasks/team");
  };

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
                  {/* ✅ FIX: Button navigates to Team Tasks page */}
                  <button 
                    className="view-tasks-btn"
                    onClick={(e) => handleViewTasks(team, e)}
                  >
                    View Tasks →
                  </button>
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
    </div>
  );
};

export default TeamManagerDashboard;
