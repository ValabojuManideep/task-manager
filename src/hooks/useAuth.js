import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Role constants
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  TEAM_MANAGER: "team-manager"
};

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { user, ...rest } = context;

  // Helper functions for role checking
  const isAdmin = user?.role === ROLES.ADMIN;
  const isTeamManager = user?.role === ROLES.TEAM_MANAGER;
  const isUser = user?.role === ROLES.USER;
  
  const hasRole = (...roles) => {
    return roles.includes(user?.role);
  };

  const canManageTeams = isAdmin || isTeamManager;

  return {
    user,
    isAdmin,
    isTeamManager,
    isUser,
    hasRole,
    canManageTeams,
    ...rest
  };
}
