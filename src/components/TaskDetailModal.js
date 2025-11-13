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

          {/* Recurrent label and end date */}
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
