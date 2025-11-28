import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useAppStore((s) => s.login_form);
  const setForm = useAppStore((s) => s.setLogin_form);
  const error = useAppStore((s) => s.login_error);
  const setError = useAppStore((s) => s.setLogin_error);
  const loading = useAppStore((s) => s.login_loading);
  const setLoading = useAppStore((s) => s.setLogin_loading);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usernameOrEmail || !form.password) {
      setError("Please enter both fields");
      return;
    }

    setLoading(true);
    setError("");
    const result = await login(form.usernameOrEmail, form.password);
    setLoading(false);

    if (result.success) {
      // Navigate on successful login
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo">
            <div className="logo-icon-large">☑</div>
            <h1 className="brand-name">TaskFlow</h1>
          </div>
          <p className="login-tagline">
            Streamline your workflow, boost productivity, and achieve your goals with our powerful task management platform.
          </p>
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Real-time collaboration</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Advanced analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Activity tracking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-field">
              <label htmlFor="usernameOrEmail">Username or Email</label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                placeholder="Enter your username or email"
                value={form.usernameOrEmail}
                onChange={handleChange}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-password">Forgot password?</button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <button type="button" className="signup-link" onClick={() => navigate("/signup")}>Sign up</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}
