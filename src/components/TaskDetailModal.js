import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import axios from "axios";
import "./TaskDetailModal.css";

export default function TaskDetailModal({ task, onClose, onUpdate, onDelete, onRefresh }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [deletingAttachment, setDeletingAttachment] = useState(null);

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
        `http://localhost:5000/api/tasks/${task._id}/download/${attachmentId}`,
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
    if (!window.confirm(`Delete "${filename}"?`)) return;

    setDeletingAttachment(attachmentId);
    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/${task._id}/attachment/${attachmentId}`,
        { 
          data: { username: user.username || 'Admin' }
        }
      );
      
      alert('Attachment deleted successfully');
      onRefresh(); // Refresh task data
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
      await axios.post(`http://localhost:5000/api/tasks/${task._id}/comment`, {
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
      await axios.put(`http://localhost:5000/api/tasks/${task._id}/comment/${commentId}`, {
        text: editText
      });
      setEditingComment(null);
      setEditText("");
      onRefresh();
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}/comment/${commentId}`);
      onRefresh();
    } catch (err) {
      console.error("Error deleting comment:", err);
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
                <button className="modal-btn delete-btn" onClick={() => { onDelete(task._id); onClose(); }}>
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
                        <p className="comment-text">{comment.text}</p>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet</p>
              )}
            </div>
            
            <div className="comment-input-wrapper">
              <input
                type="text"
                className="comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button className="comment-submit-btn" onClick={handleAddComment}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}