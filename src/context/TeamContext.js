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
    }
  };

  const updateTeam = async (id, updates) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/teams/${id}`, updates);
      await fetchTeams();
      return data;
    } catch (err) {
      console.error("Error updating team:", err);
    }
  };

  const deleteTeam = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/teams/${id}`);
      await fetchTeams();
    } catch (err) {
      console.error("Error deleting team:", err);
    }
  };

  return (
    <TeamContext.Provider value={{ teams, addTeam, updateTeam, deleteTeam, fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
};
