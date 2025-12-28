import React, { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import useAppStore from "../store/useAppStore";
import "./UserManagement.css";
import { useConfirm } from '../hooks/useConfirm';
import Swal from 'sweetalert2';

export default function UserManagement() {
  const { user } = useAuth();
  const { confirmAction } = useConfirm();

  const users = useAppStore((state) => state.users);
  const setUsers = useAppStore((state) => state.setUsers);
  const loading = useAppStore((state) => state.loading);
  const setLoading = useAppStore((state) => state.setLoading);
  const selectedUser = useAppStore((state) => state.selectedUser);
  const setSelectedUser = useAppStore((state) => state.setSelectedUser);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching users with token:", token ? "present" : "missing");
      const { data } = await axios.get(
        "/api/auth/all-users",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Users fetched successfully:", data);
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const confirmed = await confirmAction(
      'Change User Role?',
      `Are you sure you want to change this user's role to "${newRole}"?`,
      'warning'
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/auth/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Role Updated!',
        text: 'User role has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update user role. Please try again.',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "#b91c1c"; // Darker red - 4.7:1 contrast
      case "team-manager":
        return "#6d28d9"; // Darker purple - 4.6:1 contrast
      case "user":
        return "#1e40af"; // Darker blue - 7.1:1 contrast
      default:
        return "#374151"; // Dark gray - 7.5:1 contrast
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "team-manager":
        return "Team Manager";
      case "admin":
        return "Admin";
      case "user":
        return "User";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p role="status" aria-live="polite">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="user-management-container">
        <header className="header">
          <h1 id="page-title">User Management</h1>
          <p className="subtitle">Manage user roles and permissions</p>
        </header>
        <div className="empty-state">
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Page Header */}
      <header className="header">
        <div>
          <h1 id="page-title">User Management</h1>
          <p className="subtitle">Manage user roles and permissions</p>
        </div>
      </header>

      {/* Users Table Section */}
      <section className="users-section" aria-labelledby="users-table-heading">
        <h2 id="users-table-heading" className="sr-only">Users List</h2>
        <div className="users-table">
          <table role="table" aria-label="User management table">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Email</th>
                <th scope="col">Current Role</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-info">
                      <div 
                        className="avatar" 
                        aria-hidden="true"
                        role="img"
                        aria-label={`Avatar for ${u.username}`}
                      >
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="username-text">{u.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className="email-text">{u.email}</span>
                  </td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getRoleBadgeColor(u.role) }}
                      role="status"
                      aria-label={`Current role: ${getRoleDisplayName(u.role)}`}
                    >
                      {getRoleDisplayName(u.role)}
                    </span>
                  </td>
                  <td>
                    <label htmlFor={`role-select-${u._id}`} className="sr-only">
                      Change role for {u.username}
                    </label>
                    <select
                      id={`role-select-${u._id}`}
                      className="role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={String(u._id) === String(user?.id || user?._id)}
                      aria-label={`Change role for ${u.username}. Current role: ${getRoleDisplayName(u.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="team-manager">Team Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    {String(u._id) === String(user?.id || user?._id) && (
                      <span className="sr-only">Cannot change your own role</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
