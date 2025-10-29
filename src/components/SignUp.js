import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" }); // Removed role
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");
    const result = await register(form.username, form.email, form.password);
    setLoading(false);

    if (!result.success) {
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
            Join thousands of teams streamlining their workflow and boosting productivity.
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
            <h2>Create Account</h2>
            <p>Sign up to get started with TaskFlow</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="login-footer">
            <p>Already have an account? <button type="button" className="signup-link" onClick={() => navigate("/login")}>Sign in</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}
