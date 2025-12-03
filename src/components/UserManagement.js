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
        "http://localhost:5000/api/auth/all-users",
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
        `http://localhost:5000/api/auth/users/${userId}/role`,
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
        return "#ef4444";
      case "team-manager":
        return "#8b5cf6";
      case "user":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div style={{ padding: "20px", textAlign: "center" }}>
          Loading users...
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="user-management-container">
        <div className="header">
          <h1>User Management</h1>
          <p className="subtitle">Manage user roles and permissions</p>
        </div>
        <div className="empty-state">
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="header">
        <h1>User Management</h1>
        <p className="subtitle">Manage user roles and permissions</p>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="user-info">
                    <div className="avatar">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{u.username}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span
                    className="role-badge"
                    style={{ backgroundColor: getRoleBadgeColor(u.role) }}
                  >
                    {u.role === "team-manager" ? "Team Manager" : u.role}
                  </span>
                </td>
                <td>
                  <select
                    className="role-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    disabled={String(u._id) === String(user?.id || user?._id)}
                  >
                    <option value="user">User</option>
                    <option value="team-manager">Team Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
