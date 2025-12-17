
import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import axios from "axios";
import useAppStore from "../store/useAppStore";
import "./TaskDetailModal.css";
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
export default function TaskDetailModal({ task, onClose, onUpdate, onDelete, onRefresh }) {
 // const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const { user } = useAuth();
  const { confirmAction } = useConfirm();
  const commentText = useAppStore((s) => s.taskDetail_commentText);
  const setCommentText = useAppStore((s) => s.setTaskDetail_commentText);
  const editingComment = useAppStore((s) => s.taskDetail_editingComment);
  const setEditingComment = useAppStore((s) => s.setTaskDetail_editingComment);
  const editText = useAppStore((s) => s.taskDetail_editText);
  const setEditText = useAppStore((s) => s.setTaskDetail_editText);
  const deletingAttachment = useAppStore((s) => s.taskDetail_deletingAttachment);
  const setDeletingAttachment = useAppStore((s) => s.setTaskDetail_deletingAttachment);
  const users = useAppStore((s) => s.taskDetail_users);
  const setUsers = useAppStore((s) => s.setTaskDetail_users);
  const mentionDropdown = useAppStore((s) => s.taskDetail_mentionDropdown);
  const setMentionDropdown = useAppStore((s) => s.setTaskDetail_mentionDropdown);
  const mentionDropdownSelected = useAppStore((s) => s.taskDetail_mentionDropdownSelected);
  const setMentionDropdownSelected = useAppStore((s) => s.setTaskDetail_mentionDropdownSelected);

  useEffect(() => {
    async function fetchUsers() {
      try {
          const { data } = await axios.get("/api/auth/users");
        setUsers(data);
      } catch (err) {
        setUsers([]);
      }
    }
    fetchUsers();
  }, []);

  // Clear comment text when modal opens or task changes to ensure fresh input
  useEffect(() => {
    setCommentText("");
    setEditingComment(null);
    setEditText("");
    setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } });
    setMentionDropdownSelected(0);
  }, [task._id, setCommentText, setEditingComment, setEditText, setMentionDropdown, setMentionDropdownSelected]);

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id || user?._id;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word') || mimetype.includes('doc')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('sheet')) return '📊';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('text')) return '📃';
    return '📎';
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await axios.get(
        `/api/tasks/${task._id}/download/${attachmentId}`,
        { responseType: 'blob' }
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleDeleteAttachment = async (attachmentId, filename) => {
  const confirmed = await confirmAction(
    'Delete Attachment?',
    `Are you sure you want to delete "${filename}"?`,
    'warning'
  );
  if (!confirmed) return;

  setDeletingAttachment(attachmentId);
  try {
    await axios.delete(
      `/api/tasks/${task._id}/attachment/${attachmentId}`,
      { data: { username: user.username || 'Admin' } }
    );
    alert('Attachment deleted successfully');
    onRefresh();
  } catch (error) {
    console.error('Delete attachment error:', error);
    alert('Failed to delete attachment');
  } finally {
    setDeletingAttachment(null);
  }
};

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await axios.post(`/api/tasks/${task._id}/comment`, {
        userId: currentUserId,
        username: user.username,
        userRole: user.role,
        text: commentText
      });
      
      setCommentText("");
      onRefresh();
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await axios.put(`/api/tasks/${task._id}/comments/${commentId}`, {
        text: editText
      });
      setEditingComment(null);
      setEditText("");
      onRefresh();
    } catch (err) {
      console.error("Error editing comment:", err.response?.data || err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = await confirmAction(
      'Delete Comment?',
      'Are you sure you want to delete this comment?',
      'warning'
    );
    if (!confirmed) return;

    try {
      await axios.delete(`/api/tasks/${task._id}/comments/${commentId}`);
      onRefresh();
    } catch (err) {
      console.error("Error deleting comment:", err.response?.data || err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2 className="modal-title">{task.title}</h2>
          <span className="modal-priority" style={{ color: getPriorityColor(task.priority) }}>
            {task.priority.toUpperCase()}
          </span>
        </div>

        <div className="modal-body">
          {/* Recurrent Task Label and End Date */}
          {task.isRecurrent && (
            <div className="modal-section" style={{ marginBottom: '1rem' }}>
              <span className="recurrent-label" style={{
                display: 'inline-block',
                background: '#e0e7ff',
                color: '#3730a3',
                borderRadius: '6px',
                padding: '4px 12px',
                fontWeight: 600,
                marginRight: '1rem',
                fontSize: '1em',
              }}>
                🔁 Recurrent Task
              </span>
              {task.recurrenceEndDate && (
                <span className="recurrent-end-date" style={{
                  color: '#5B7FFF',
                  fontWeight: 500,
                  fontSize: '1em',
                }}>
                  Ends: {format(new Date(task.recurrenceEndDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
          )}

          {task.description && (
            <div className="modal-section">
              <h3>Description</h3>
              <p className="modal-description">{task.description}</p>
            </div>
          )}

          <div className="modal-info-grid">
            {task.assignedTo && (
              <div className="modal-info-item">
                <span className="info-label">Assigned to:</span>
                <span className="info-value">{task.assignedTo.username}</span>
              </div>
            )}
            <div className="modal-info-item">
              <span className="info-label">Status:</span>
              <span className="info-value status-badge">{task.status}</span>
            </div>
            {task.dueDate && (
              <div className="modal-info-item">
                <span className="info-label">Due date:</span>
                <span className="info-value">{format(new Date(task.dueDate), "MMM d, yyyy h:mm a")}</span>
              </div>
            )}
          </div>

          {/* ATTACHMENTS SECTION */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="modal-section" style={{ marginTop: "20px" }}>
              <h3>📎 Attachments ({task.attachments.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#f9f9f9",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                      transition: "border-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "1.5em" }}>{getFileIcon(attachment.mimetype)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          margin: 0, 
                          fontWeight: "500", 
                          fontSize: "0.95em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {attachment.filename}
                        </p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.8em", color: "#666" }}>
                          {attachment.mimetype}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px", marginLeft: "12px" }}>
                      <button
                        onClick={() => handleDownloadAttachment(attachment._id, attachment.filename)}
                        style={{
                          padding: "6px 12px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85em",
                          fontWeight: "500",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                      >
                        Download
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAttachment(attachment._id, attachment.filename)}
                          disabled={deletingAttachment === attachment._id}
                          style={{
                            padding: "6px 12px",
                            background: deletingAttachment === attachment._id ? "#ccc" : "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: deletingAttachment === attachment._id ? "not-allowed" : "pointer",
                            fontSize: "0.85em",
                            fontWeight: "500",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (deletingAttachment !== attachment._id) {
                              e.currentTarget.style.background = "#dc2626";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deletingAttachment !== attachment._id) {
                              e.currentTarget.style.background = "#ef4444";
                            }
                          }}
                        >
                          {deletingAttachment === attachment._id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {isAdmin ? (
              <>
                <button className="modal-btn done-btn" onClick={() => { onUpdate(task._id, { status: "done" }); onClose(); }}>
                  ✓ Mark Done
                </button>
                <button 
                          className="modal-btn delete-btn" 
                          onClick={async () => {
                            const confirmed = await confirmAction(
                              'Delete Task?',
                              `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
                              'error'
                            );
                            if (confirmed) {
                              onDelete(task._id);
                              onClose();
                            }
                          }}
                        >
                          🗑 Delete
                        </button>
              </>
            ) : (
              <>
                {task.status === "todo" && (
                  <button className="modal-btn progress-btn" onClick={() => { onUpdate(task._id, { status: "in_progress", userId: user.username }); onClose(); }}>
                    ▶️ Start
                  </button>
                )}
                {task.status === "in_progress" && (
                  <button className="modal-btn done-btn" onClick={() => { onUpdate(task._id, { status: "done", userId: user.username }); onClose(); }}>
                    ✓ Complete
                  </button>
                )}
              </>
            )}
          </div>

          <div className="modal-section">
            <h3>Comments ({task.comments?.length || 0})</h3>
            <div className="modal-comments-list">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment._id} className={`modal-comment ${comment.userRole === 'admin' ? 'admin-comment' : ''}`}>
                    {editingComment === comment._id ? (
                      <div className="edit-comment-wrapper">
                        <input
                          type="text"
                          className="edit-comment-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                        />
                        <div className="edit-comment-actions">
                          <button className="save-edit-btn" onClick={() => handleEditComment(comment._id)}>Save</button>
                          <button className="cancel-edit-btn" onClick={() => { setEditingComment(null); setEditText(""); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="comment-header">
                          <div className="comment-user-info">
                            <strong>{comment.username}</strong>
                            {comment.userRole === 'admin' && <span className="admin-badge">ADMIN</span>}
                            {comment.userRole === 'team-manager' && <span className="team-manager-badge">TEAM MANAGER</span>}
                          </div>

                          <div className="comment-meta">
                            <span className="comment-time">
                              {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                              {comment.updatedAt && comment.updatedAt !== comment.createdAt && " (edited)"}
                            </span>
                            {String(comment.userId) === String(currentUserId) && (
                              <div className="comment-actions-menu">
                                <button className="comment-action-icon" onClick={() => { setEditingComment(comment._id); setEditText(comment.text); }}>✏️</button>
                                <button className="comment-action-icon" onClick={() => handleDeleteComment(comment._id)}>🗑️</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="comment-text">{highlightMentions(comment.text)}</p>
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
                  value={commentText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCommentText(val);
                    if (task.isTeamTask) {
                      const cursor = e.target.selectionStart;
                      const atIdx = val.lastIndexOf("@", cursor - 1);
                      setMentionDropdown({
                        show: atIdx !== -1 && (atIdx === 0 || /\s/.test(val[atIdx - 1])),
                        search: atIdx !== -1 ? val.slice(atIdx + 1, cursor) : "",
                        pos: { left: 0, top: -120 }
                      });
                    } else {
                      setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (task.isTeamTask && mentionDropdown.show) {
                      const teamMembers = task.assignedToTeam?.members || [];
                      const filteredUsers = users.filter(u =>
                        teamMembers.some(m => m._id === u._id) &&
                        u.username.toLowerCase().includes(mentionDropdown.search.toLowerCase())
                      );
                      let selectedIdx = mentionDropdownSelected;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        selectedIdx = Math.min(selectedIdx + 1, filteredUsers.length - 1);
                        setMentionDropdownSelected(selectedIdx);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        selectedIdx = Math.max(selectedIdx - 1, 0);
                        setMentionDropdownSelected(selectedIdx);
                      } else if (e.key === "Enter" && filteredUsers.length > 0) {
                        e.preventDefault();
                        const u = filteredUsers[selectedIdx];
                        const val = commentText || "";
                        const cursor = e.target.selectionStart;
                        const atIdx = val.lastIndexOf("@", cursor - 1);
                        const before = val.slice(0, atIdx + 1);
                        const after = val.slice(cursor);
                        setCommentText(before + u.username + " " + after);
                        setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } });
                        setMentionDropdownSelected(0);
                      } else if (e.key === "Escape") {
                        setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } });
                        setMentionDropdownSelected(0);
                      }
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComment();
                      setCommentText("");
                      setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } });
                      setMentionDropdownSelected(0);
                    }
                  }}
                />
                {task.isTeamTask && mentionDropdown.show && (
                  <div style={{
                    position: "absolute",
                    left: mentionDropdown.pos.left,
                    top: mentionDropdown.pos.top,
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
                        u.username.toLowerCase().includes(mentionDropdown.search.toLowerCase())
                      ).map((u, idx) => (
                        <div
                          key={u._id}
                          style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            background: mentionDropdownSelected === idx ? "#e6edff" : "inherit",
                            color: mentionDropdownSelected === idx ? "#2346a0" : "#222",
                            fontWeight: mentionDropdownSelected === idx ? "bold" : "normal",
                            borderLeft: mentionDropdownSelected === idx ? "4px solid #5B7FFF" : "4px solid transparent"
                          }}
                          onMouseDown={e => {
                            e.preventDefault();
                            const val = commentText || "";
                            const cursor = document.activeElement.selectionStart;
                            const atIdx = val.lastIndexOf("@", cursor - 1);
                            const before = val.slice(0, atIdx + 1);
                            const after = val.slice(cursor);
                            setCommentText(before + u.username + " " + after);
                            setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } });
                            setMentionDropdownSelected(0);
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
              <button className="comment-submit-btn" onClick={() => { handleAddComment(); setCommentText(""); setMentionDropdown({ show: false, search: "", pos: { left: 0, top: 40 } }); setMentionDropdownSelected(0); }}>Send</button>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}