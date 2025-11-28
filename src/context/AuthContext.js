import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAppStore from "../store/useAppStore";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const authLoading = useAppStore((s) => s.authLoading);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setAuthLoading(false);
  }, [setUser, setAuthLoading]);

  if (authLoading) return <div>Loading...</div>;

  return children;
};

export const useAuth = () => {
  // Import here to avoid circular dependency
  const useAuthHook = require("../hooks/useAuth").useAuth;
  return useAuthHook();
};
