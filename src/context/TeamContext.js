import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);

  const fetchTeams = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/teams");
      setTeams(data);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const addTeam = async (team) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/teams", team);
      await fetchTeams();
      return data;
    } catch (err) {
      console.error("Error adding team:", err);
      throw err;
    }
  };

  const updateTeam = async (id, updates) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/teams/${id}`, updates);
      await fetchTeams();
      return data;
    } catch (err) {
      console.error("Error updating team:", err);
      throw err;
    }
  };

  const deleteTeam = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/teams/${id}`);
      await fetchTeams();
    } catch (err) {
      console.error("Error deleting team:", err);
      throw err;
    }
  };

  // ✅ NEW: Assign team manager (admin only)
  const addTeamManager = async (teamId, userId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `http://localhost:5000/api/teams/${teamId}/managers`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTeams();
      return data;
    } catch (err) {
      console.error("Error adding team manager:", err);
      throw err;
    }
  };

  // ✅ NEW: Remove team manager (admin only)
  const removeTeamManager = async (teamId, userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/teams/${teamId}/managers/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTeams();
    } catch (err) {
      console.error("Error removing team manager:", err);
      throw err;
    }
  };

  // ✅ NEW: Get team tasks (team-manager can access)
  const getTeamTasks = async (teamId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `http://localhost:5000/api/teams/${teamId}/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (err) {
      console.error("Error fetching team tasks:", err);
      throw err;
    }
  };

  // ✅ NEW: Add member to team (team-manager can do this)
  const addTeamMember = async (teamId, userId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `http://localhost:5000/api/teams/${teamId}/members`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTeams();
      return data;
    } catch (err) {
      console.error("Error adding team member:", err);
      throw err;
    }
  };

  // ✅ NEW: Remove member from team (team-manager can do this)
  const removeTeamMember = async (teamId, userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/teams/${teamId}/members/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTeams();
    } catch (err) {
      console.error("Error removing team member:", err);
      throw err;
    }
  };

  return (
    <TeamContext.Provider value={{ 
      teams, 
      addTeam, 
      updateTeam, 
      deleteTeam, 
      fetchTeams,
      addTeamManager,       // ✅ NEW
      removeTeamManager,    // ✅ NEW
      getTeamTasks,         // ✅ NEW
      addTeamMember,        // ✅ NEW
      removeTeamMember      // ✅ NEW
    }}>
      {children}
    </TeamContext.Provider>
  );
};
