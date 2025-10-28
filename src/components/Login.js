import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Please enter both username and password");
      return;
    }
    setError("");
    login(form.username, form.password);
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
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
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
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="#">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
