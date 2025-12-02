import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import axios from "axios";
import TaskDetailModal from "./TaskDetailModal";
import "./TaskList.css";
import useAppStore from "../store/useAppStore";
import { toast } from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';

// Highlight @username mentions in comment text
function highlightMentions(text) {
  if (!text) return null;
  const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span key={key++} className="mention-highlight">@{match[1]}</span>
    );
    lastIndex = mentionRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}

export default function TaskList({ statusFilter, priorityFilter, displayTasks }) {
  const teams = useAppStore((s) => s.teams);
  console.log("All tasks:", displayTasks);

  const showRecurrentEnd = useAppStore((s) => s.taskList_showRecurrentEnd);
  const setShowRecurrentEnd = useAppStore((s) => s.setTaskList_showRecurrentEnd);
  const endedTaskTitle = useAppStore((s) => s.taskList_endedTaskTitle);
  const setEndedTaskTitle = useAppStore((s) => s.setTaskList_endedTaskTitle);
  const notifiedRecurrentTasks = useAppStore((s) => s.taskList_notifiedRecurrentTasks);
  const setNotifiedRecurrentTasks = useAppStore((s) => s.setTaskList_notifiedRecurrentTasks);

  // Removed useEffect that showed recurrent task ended popup on login/page load

  const expandedTask = useAppStore((s) => s.taskList_expandedTask);
  const setExpandedTask = useAppStore((s) => s.setTaskList_expandedTask);
  const selectedTask = useAppStore((s) => s.taskList_selectedTask);
  const setSelectedTask = useAppStore((s) => s.setTaskList_selectedTask);
  const commentInputs = useAppStore((s) => s.taskList_commentInputs);
  const setCommentInputs = useAppStore((s) => s.setTaskList_commentInputs);
  const mentionDropdowns = useAppStore((s) => s.taskList_mentionDropdowns);
  const setMentionDropdowns = useAppStore((s) => s.setTaskList_mentionDropdowns);
  const mentionDropdownSelected = useAppStore((s) => s.taskList_mentionDropdownSelected);
  const setMentionDropdownSelected = useAppStore((s) => s.setTaskList_mentionDropdownSelected);
  const editingComment = useAppStore((s) => s.taskList_editingComment);
  const setEditingComment = useAppStore((s) => s.setTaskList_editingComment);
  const editText = useAppStore((s) => s.taskList_editText);
  const setEditText = useAppStore((s) => s.setTaskList_editText);
  const logTaskId = useAppStore((s) => s.taskList_logTaskId);
  const setLogTaskId = useAppStore((s) => s.setTaskList_logTaskId);

  const { confirmAction } = useConfirm(); // ✅ Import SweetAlert2 hook

  const updateTask = async (taskId, updates) => {
    try {
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, updates);
      const { data } = await axios.get("http://localhost:5000/api/tasks");
      useAppStore.setState({ tasks: data, allTasks: data });
      toast.success("Task updated successfully!");
    } catch (err) {
      toast.error("Failed to update task!");
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      console.log("🗑 Attempting to delete task:", taskId);
      const response = await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      console.log("✅ Task deleted successfully:", response.data);
      toast.success("Task deleted successfully!");
      const { data } = await axios.get("http://localhost:5000/api/tasks");
      useAppStore.setState({ tasks: data, allTasks: data });
    } catch (err) {
      console.error("❌ Error deleting task:", err.response?.data || err.message);
      toast.error("Failed to delete task!");
      alert(`Failed to delete task: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteClick = async (taskId, taskName) => {
    const confirmed = await confirmAction(
      'Delete Task?',
      `Are you sure you want to delete "${taskName}"? This action cannot be undone.`,
      'error'
    );
    if (confirmed) {
      deleteTask(taskId);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/tasks");
      useAppStore.setState({ tasks: data, allTasks: data });
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const { user } = useAuth();
  const users = useAppStore((s) => s.taskList_users);
  const setUsers = useAppStore((s) => s.setTaskList_users);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await axios.get("http://localhost:5000/api/auth/users");
        setUsers(data);
      } catch (err) {
        setUsers([]);
      }
    }
    fetchUsers();
  }, []);

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id || user?._id;

  // ---------------- PAGINATION ----------------
  const page = useAppStore((s) => s.taskList_page);
  const setPage = useAppStore((s) => s.setTaskList_page);
  const pageSize = 9;

  const filtered = (displayTasks || []).filter((t) => {
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority =
      priorityFilter === "All Priority" || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedTasks = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
  }, [statusFilter, priorityFilter]);

  // -------------------------------------------------

  const handleMarkDone = async (task) => {
    const id = task._id || task.id;

    // Optional: Confirm before marking recurrent task as done (if it's the last occurrence)
    if (
      (task.isRecurrent || (task.recurrencePattern && task.recurrencePattern !== "none")) &&
      task.recurrenceEndDate &&
      task.dueDate &&
      new Date(task.dueDate).toDateString() === new Date(task.recurrenceEndDate).toDateString()
    ) {
      const confirmed = await confirmAction(
        'Final Recurrent Task',
        `This is the final occurrence of "${task.title}". Are you sure you want to mark it as done?`,
        'info'
      );
      if (!confirmed) return;
    }

    updateTask(id, {
      status: "done",
      recurrencePattern: task.recurrencePattern,
      isRecurrent: !!task.isRecurrent,
      dueDate: task.dueDate,
    });
  };

  const handleTaskCardClick = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#ef4444";
      case "Medium":
        return "#f59e0b";
      case "Low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.text);
  };

  const handleAddComment = async (taskId, text) => {
    if (!text.trim()) return;
    try {
      console.log('Adding comment to:', `/api/tasks/${taskId}/comment`, 'with text:', text);
      await axios.post(`/api/tasks/${taskId}/comment`, {
        text,
        username: user.username,
        userId: currentUserId,
        userRole: user.role,
      });
      // Wait for fetchTasks to complete before updating UI
      await fetchTasks();
      // Optionally, force re-render for selected/expanded task
      setExpandedTask(taskId); // This will re-expand and show updated comments
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditComment = async (taskId, commentId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`/api/tasks/${taskId}/comments/${commentId}`, {
        text: editText,
      });
      setEditingComment(null);
      setEditText("");
      fetchTasks();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}/comments/${commentId}`);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <>
      {showRecurrentEnd && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#f3f4f6",
            border: "2px solid #c7d2fe",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(99,102,241,0.10)",
            padding: "32px 28px",
            minWidth: "320px",
            zIndex: 2000,
            color: "#312e81",
            fontFamily: "Segoe UI, Arial, sans-serif",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: "18px", color: "#4338ca" }}>
            Recurrent Task Ended
          </h3>
          <p style={{ fontSize: "1.1em", marginBottom: "18px" }}>
            The recurrent task <strong>{endedTaskTitle}</strong> has reached its
            end date and is completed successfully.
          </p>
          <button
            onClick={() => setShowRecurrentEnd(false)}
            style={{
              background: "#e0e7ff",
              color: "#3730a3",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: "bold",
              fontSize: "1em",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(91,127,255,0.08)",
            }}
          >
            OK
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-tasks">
          <div className="empty-icon">📋</div>
          <h3>No tasks found</h3>
          <p>
            {isAdmin
              ? "Create your first task to get started"
              : "No tasks assigned to you yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="task-list-container">
            {paginatedTasks.map((task) => {
              const id = task._id || task.id;
              const isExpanded = expandedTask === id;

              return (
                <div
                  key={id}
                  className="task-card"
                  onClick={(e) => handleTaskCardClick(task, e)}
                >
                  <div
                    className="task-card-header"
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <h3 className="task-card-title">{task.title}</h3>
                    <span
                      className="task-priority"
                      style={{ color: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>

                    {(task.isRecurrent ||
                      (task.recurrencePattern &&
                        task.recurrencePattern !== "none")) && (
                      <span
                        className="task-recurrent-label"
                        style={{
                          color: "#6366f1",
                          fontWeight: "bold",
                          fontSize: "0.9em",
                          border: "1px solid #6366f1",
                          borderRadius: "4px",
                          padding: "2px 6px",
                        }}
                      >
                        Recurrent
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}

                  <div className="task-assigned">
                    {task.isTeamTask ? (
                      <>
                        👥 Team:{" "}
                        <strong>{task.assignedToTeam?.name || "No team"}</strong>
                        <span className="team-members-count">
                          {" "}
                          ({task.assignedToTeam?.members?.length || 0} members)
                        </span>
                      </>
                    ) : (
                      <>
                        👤 Assigned to:{" "}
                        <strong>
                          {task.assignedTo?.username ||
                            task.assignedTo?.email ||
                            "Unassigned"}
                        </strong>
                      </>
                    )}
                  </div>

                  <div className="task-card-footer">
                    <span className="task-status-badge">{task.status}</span>
                    {task.dueDate && (
                      <span className="task-due">
                        Due:{" "}
                        {format(new Date(task.dueDate), "MMM d, yyyy h:mm a")}
                      </span>
                    )}
                  </div>

                  <div className="task-actions">
                    {isAdmin ? (
                      <>
                        <button
                          className="task-action-btn done-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkDone(task);
                          }}
                        >
                          ✓ Mark Done
                        </button>
                        <button
                          className="task-action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(id, task.title);
                          }}
                        >
                          🗑 Delete
                        </button>
                        <button
                          className="task-action-btn comment-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTask(isExpanded ? null : id);
                          }}
                        >
                          💬 Comments ({task.comments?.length || 0})
                        </button>
                        {(task.isRecurrent ||
                          (task.recurrencePattern &&
                            task.recurrencePattern !== "none")) && (
                          <button
                            className="task-action-btn log-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogTaskId(id);
                            }}
                          >
                            📜 Completion Log
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {task.status === "todo" && (
                          <button
                            className="task-action-btn progress-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask(id, {
                                status: "in_progress",
                                userId: user.username,
                              });
                            }}
                          >
                            ▶️ Start
                          </button>
                        )}
                        {task.status === "in_progress" && (
                          <button
                            className="task-action-btn done-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTask(id, {
                                status: "done",
                                userId: user.username,
                              });
                            }}
                          >
                            ✓ Complete
                          </button>
                        )}
                        <button
                          className="task-action-btn comment-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTask(isExpanded ? null : id);
                          }}
                        >
                          💬 Comments ({task.comments?.length || 0})
                        </button>
                        {(task.isRecurrent ||
                          (task.recurrencePattern &&
                            task.recurrencePattern !== "none")) && (
                          <button
                            className="task-action-btn log-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogTaskId(id);
                            }}
                          >
                            📜 Completion Log
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {logTaskId === id && (
                    <div
                      className="completion-log-modal"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "#f3f4f6",
                        border: "1.5px solid #c7d2fe",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(99,102,241,0.10)",
                        padding: "24px 20px",
                        minWidth: "300px",
                        zIndex: 1000,
                        color: "#312e81",
                        fontFamily: "Segoe UI, Arial, sans-serif",
                        textAlign: "left",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 16px 0",
                          fontWeight: 700,
                          fontSize: "1.15em",
                          color: "#4338ca",
                        }}
                      >
                        Completion Log
                      </h3>

                      {task.completionLog && task.completionLog.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: "18px" }}>
                          {task.completionLog.map((log, idx) => (
                            <li
                              key={idx}
                              style={{
                                marginBottom: "10px",
                                fontSize: "1em",
                                color: "#374151",
                              }}
                            >
                              {log.completedBy || "Unknown"} on{" "}
                              {format(
                                new Date(log.completedAt),
                                "MMM d, yyyy h:mm a"
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p
                          style={{
                            color: "#6366f1",
                            fontStyle: "italic",
                            margin: "12px 0",
                          }}
                        >
                          No completion history yet.
                        </p>
                      )}

                      <button
                        className="close-log-btn"
                        onClick={() => setLogTaskId(null)}
                        style={{
                          marginTop: "16px",
                          background: "#e0e7ff",
                          color: "#3730a3",
                          border: "none",
                          borderRadius: "6px",
                          padding: "7px 18px",
                          fontWeight: 600,
                          fontSize: "1em",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
                        }}
                      >
                        Close
                      </button>
                    </div>
                  )}

                  {isExpanded && (
                    <div
                      className="comments-section"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="comments-list">
                        {task.comments && task.comments.length > 0 ? (
                          task.comments.map((comment) => (
                            <div
                              key={comment._id}
                              className={`comment-item ${
                                comment.userRole === "admin"
                                  ? "admin-comment"
                                  : ""
                              }`}
                            >
                              {editingComment === comment._id ? (
                                <div className="edit-comment-wrapper">
                                  <input
                                    type="text"
                                    className="edit-comment-input"
                                    value={editText}
                                    onChange={(e) =>
                                      setEditText(e.target.value)
                                    }
                                    autoFocus
                                  />
                                  <div className="edit-comment-actions">
                                    <button
                                      className="save-edit-btn"
                                      onClick={() =>
                                        handleEditComment(id, comment._id)
                                      }
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="cancel-edit-btn"
                                      onClick={() => {
                                        setEditingComment(null);
                                        setEditText("");
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="comment-header">
                                    <div className="comment-user-info">
                                      <strong>{comment.username}</strong>
                                      {comment.userRole === "admin" && (
                                        <span className="admin-badge">
                                          ADMIN
                                        </span>
                                      )}
                                    </div>
                                    <div className="comment-meta">
                                      <span className="comment-time">
                                        {format(
                                          new Date(comment.createdAt),
                                          "MMM d, h:mm a"
                                        )}
                                        {comment.updatedAt &&
                                          comment.updatedAt !==
                                            comment.createdAt &&
                                          " (edited)"}
                                      </span>
                                      {String(comment.userId) ===
                                        String(currentUserId) && (
                                        <div className="comment-actions-menu">
                                          <button
                                            className="comment-action-icon"
                                            onClick={() => startEdit(comment)}
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            className="comment-action-icon"
                                            onClick={() =>
                                              handleDeleteComment(
                                                id,
                                                comment._id
                                              )
                                            }
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="comment-text">
                                    {highlightMentions(comment.text)}
                                  </p>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="no-comments">No comments yet</p>
                        )}
                      </div>

                      <div className="comment-input-wrapper">
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            className="comment-input"
                            placeholder="Add a comment..."
                            value={commentInputs[id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCommentInputs(inputs => ({ ...inputs, [id]: val }));
                              if (task.isTeamTask) {
                                const cursor = e.target.selectionStart;
                                const atIdx = val.lastIndexOf("@", cursor - 1);
                                setMentionDropdowns(dropdowns => ({
                                  ...dropdowns,
                                  [id]: {
                                    show: atIdx !== -1 && (atIdx === 0 || /\s/.test(val[atIdx - 1])),
                                    search: atIdx !== -1 ? val.slice(atIdx + 1, cursor) : "",
                                    pos: { left: 0, top: -120 }
                                  }
                                }));
                              } else {
                                setMentionDropdowns(dropdowns => ({ ...dropdowns, [id]: { show: false, search: "", pos: { left: 0, top: 40 } } }));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (task.isTeamTask && mentionDropdowns[id]?.show) {
                                // Only show team members in dropdown
                                const teamMembers = task.assignedToTeam?.members || [];
                                const filteredUsers = users.filter(u =>
                                  teamMembers.some(m => m._id === u._id) &&
                                  u.username.toLowerCase().includes(mentionDropdowns[id].search.toLowerCase())
                                );
                                let selectedIdx = mentionDropdownSelected[id] ?? 0;
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  selectedIdx = Math.min(selectedIdx + 1, filteredUsers.length - 1);
                                  setMentionDropdownSelected(sel => ({ ...sel, [id]: selectedIdx }));
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  selectedIdx = Math.max(selectedIdx - 1, 0);
                                  setMentionDropdownSelected(sel => ({ ...sel, [id]: selectedIdx }));
                                } else if (e.key === "Enter" && filteredUsers.length > 0) {
                                  e.preventDefault();
                                  const u = filteredUsers[selectedIdx];
                                  const val = commentInputs[id] || "";
                                  const cursor = e.target.selectionStart;
                                  const atIdx = val.lastIndexOf("@", cursor - 1);
                                  const before = val.slice(0, atIdx + 1);
                                  const after = val.slice(cursor);
                                  setCommentInputs(inputs => ({ ...inputs, [id]: before + u.username + " " + after }));
                                  setMentionDropdowns(dropdowns => ({ ...dropdowns, [id]: { show: false, search: "", pos: { left: 0, top: 40 } } }));
                                  setMentionDropdownSelected(sel => ({ ...sel, [id]: 0 }));
                                } else if (e.key === "Escape") {
                                  setMentionDropdowns(dropdowns => ({ ...dropdowns, [id]: { show: false, search: "", pos: { left: 0, top: 40 } } }));
                                  setMentionDropdownSelected(sel => ({ ...sel, [id]: 0 }));
                                }
                              } else if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddComment(id, commentInputs[id] || "");
                                setCommentInputs(inputs => ({ ...inputs, [id]: "" }));
                                setMentionDropdowns(dropdowns => ({ ...dropdowns, [id]: { show: false, search: "", pos: { left: 0, top: 40 } } }));
                              }
                            }}
                          />
                          {task.isTeamTask && mentionDropdowns[id]?.show && (
                            <div style={{
                              position: "absolute",
                              left: mentionDropdowns[id].pos.left,
                              top: mentionDropdowns[id].pos.top,
                              background: "#f8f9ff",
                              border: "2px solid #5B7FFF",
                              borderRadius: "10px",
                              boxShadow: "0 8px 32px rgba(91,127,255,0.25)",
                              zIndex: 9999,
                              minWidth: "200px",
                              maxHeight: "220px",
                              overflowY: "auto",
                              fontSize: "1rem"
                            }}>
                              {(task.assignedToTeam?.members || []).length > 0 ? (
                                users.filter(u =>
                                  (task.assignedToTeam?.members || []).some(m => m._id === u._id) &&
                                  u.username.toLowerCase().includes(mentionDropdowns[id].search.toLowerCase())
                                ).map((u, idx) => (
                                  <div
                                    key={u._id}
                                    style={{
                                      padding: "10px 16px",
                                      cursor: "pointer",
                                      background: (mentionDropdownSelected[id] ?? 0) === idx ? "#e6edff" : "inherit",
                                      color: (mentionDropdownSelected[id] ?? 0) === idx ? "#2346a0" : "#222",
                                      fontWeight: (mentionDropdownSelected[id] ?? 0) === idx ? "bold" : "normal",
                                      borderLeft: (mentionDropdownSelected[id] ?? 0) === idx ? "4px solid #5B7FFF" : "4px solid transparent"
                                    }}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      const val = commentInputs[id] || "";
                                      const cursor = document.activeElement.selectionStart;
                                      const atIdx = val.lastIndexOf("@", cursor - 1);
                                      const before = val.slice(0, atIdx + 1);
                                      const after = val.slice(cursor);
                                      setCommentInputs(inputs => ({ ...inputs, [id]: before + u.username + " " + after }));
                                      setMentionDropdowns(dropdowns => ({ ...dropdowns, [id]: { show: false, search: "", pos: { left: 0, top: 40 } } }));
                                      setMentionDropdownSelected(sel => ({ ...sel, [id]: 0 }));
                                    }}
                                  >
                                    @{u.username}
                                  </div>
                                ))
                              ) : (
                                <div style={{ padding: "10px 16px", color: "#999" }}>No team members found</div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="comment-submit-btn"
                          onClick={() => {
                            handleAddComment(id, commentInputs[id] || "");
                            setCommentInputs(inputs => ({ ...inputs, [id]: "" }));
                            setMentionDropdowns(dropdowns => ({ ...dropdowns, [id]: { show: false, search: "", pos: { left: 0, top: 40 } } }));
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls - P1 */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1.2rem",
                margin: "2rem 0",
              }}
            >
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  padding: "0.5rem 1.2rem",
                  background: page === 1 ? "#e5e7eb" : "#5B7FFF",
                  color: page === 1 ? "#6b7280" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(91,127,255,0.08)",
                }}
              >
                Prev
              </button>

              <span style={{ fontWeight: 600, color: "#5B7FFF" }}>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                style={{
                  padding: "0.5rem 1.2rem",
                  background: page === totalPages ? "#e5e7eb" : "#5B7FFF",
                  color: page === totalPages ? "#6b7280" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(91,127,255,0.08)",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onRefresh={() => {
            fetchTasks();
            const updatedTask = displayTasks.find(
              (t) => t._id === selectedTask._id
            );
            if (updatedTask) setSelectedTask(updatedTask);
          }}
        />
      )}

      {/* ❌ REMOVED: Custom delete confirmation overlay */}
      {/* {deleteConfirm.show && (...)} */}
    </>
  );
}