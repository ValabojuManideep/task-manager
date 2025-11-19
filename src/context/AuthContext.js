import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // ✅ Set default axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", { usernameOrEmail, password });
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // ✅ Set authorization header after login
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      navigate("/");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Login failed" };
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/register", { username, email, password });
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // ✅ Set authorization header after register
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      navigate("/");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // ✅ Remove authorization header on logout
    delete axios.defaults.headers.common['Authorization'];
    navigate("/login");
  };

  const updateUser = (next) => {
    setUser(next);
    if (next) localStorage.setItem("user", JSON.stringify(next));
    else localStorage.removeItem("user");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };
