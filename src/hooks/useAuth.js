import useAppStore from "../store/useAppStore";

// Role constants
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  TEAM_MANAGER: "team-manager"
};

export function useAuth() {
  const user = useAppStore((s) => s.user);
  const login = useAppStore((s) => s.loginAction);
  const register = useAppStore((s) => s.registerAction);
  const logout = useAppStore((s) => s.logoutAction);
  const updateUser = useAppStore((s) => s.updateUser);

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
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isTeamManager,
    isUser,
    hasRole,
    canManageTeams
  };
}
