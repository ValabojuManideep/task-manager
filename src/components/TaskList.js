import React, { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import axios from "axios";
import "./TaskList.css";

export default function TaskList({ statusFilter, priorityFilter, displayTasks }) {
  const { updateTask, deleteTask, fetchTasks } = useContext(TaskContext);
  const { user } = useAuth();
  const [expandedTask, setExpandedTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id || user?._id;

  const filtered = (displayTasks || []).filter((t) => {
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority = priorityFilter === "All Priority" || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) return;

    try {
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/comment`, {
        userId: currentUserId,
        username: user.username,
        userRole: user.role,
        text: commentText
      });
      
      setCommentText("");
      await fetchTasks();
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleEditComment = async (taskId, commentId) => {
    if (!editText.trim()) return;

    try {
      await axios.put(`http://localhost:5000/api/tasks/${taskId}/comment/${commentId}`, {
        text: editText
      });
      setEditingComment(null);
      setEditText("");
      await fetchTasks();
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}/comment/${commentId}`);
      await fetchTasks();
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.text);
  };

  if (filtered.length === 0) {
    return (
      <div className="empty-tasks">
        <div className="empty-icon">📋</div>
        <h3>No tasks found</h3>
        <p>{isAdmin ? "Create your first task to get started" : "No tasks assigned to you yet"}</p>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {filtered.map((task) => {
        const id = task._id || task.id;
        const isExpanded = expandedTask === id;
        
        return (
          <div key={id} className="task-card">
            <div className="task-card-header">
              <h3 className="task-card-title">{task.title}</h3>
              <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                {task.priority}
              </span>
            </div>
            {task.description && <p className="task-description">{task.description}</p>}
            
            {task.assignedTo && (
              <div className="task-assigned">
                👤 Assigned to: <strong>{task.assignedTo.username}</strong>
              </div>
            )}

            <div className="task-card-footer">
              <span className="task-status-badge">{task.status}</span>
              {task.dueDate && (
                <span className="task-due">Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
              )}
            </div>

            <div className="task-actions">
              {isAdmin ? (
                <>
                  <button className="task-action-btn done-btn" onClick={() => updateTask(id, { status: "done" })}>
                    ✓ Mark Done
                  </button>
                  <button className="task-action-btn delete-btn" onClick={() => deleteTask(id)}>
                    🗑 Delete
                  </button>
                  <button 
                    className="task-action-btn comment-btn"
                    onClick={() => setExpandedTask(isExpanded ? null : id)}
                  >
                    💬 Comments ({task.comments?.length || 0})
                  </button>
                </>
              ) : (
                <>
                {task.status === "todo" && (
                    <button 
                        className="task-action-btn progress-btn"
                        onClick={() => {
                        console.log("Updating task with user:", user);
                        console.log("Username being sent:", user.username);
                        updateTask(id, { 
                            status: "in_progress",
                            userId: user.username
                        });
                        }}
                    >
                        ▶️ Start
                    </button>
                )}

                    {task.status === "in_progress" && (
                    <button 
                        className="task-action-btn done-btn"
                        onClick={() => updateTask(id, { 
                        status: "done",
                        userId: user.username  // This should pass username properly
                        })}
                    >
                        ✓ Complete
                    </button>
                    )}

                  <button 
                    className="task-action-btn comment-btn"
                    onClick={() => setExpandedTask(isExpanded ? null : id)}
                  >
                    💬 Comments ({task.comments?.length || 0})
                  </button>
                </>
              )}
            </div>

            {isExpanded && (
              <div className="comments-section">
                <div className="comments-list">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => (
                      <div 
                        key={comment._id} 
                        className={`comment-item ${comment.userRole === 'admin' ? 'admin-comment' : ''}`}
                      >
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
                              <button 
                                className="save-edit-btn"
                                onClick={() => handleEditComment(id, comment._id)}
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
                                {comment.userRole === 'admin' && (
                                  <span className="admin-badge">ADMIN</span>
                                )}
                              </div>
                              <div className="comment-meta">
                                <span className="comment-time">
                                  {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && " (edited)"}
                                </span>
                                {String(comment.userId) === String(currentUserId) && (
                                  <div className="comment-actions-menu">
                                    <button 
                                      className="comment-action-icon"
                                      onClick={() => startEdit(comment)}
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      className="comment-action-icon"
                                      onClick={() => handleDeleteComment(id, comment._id)}
                                    >
                                      🗑️
                                    </button>
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
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(id)}
                  />
                  <button 
                    className="comment-submit-btn"
                    onClick={() => handleAddComment(id)}
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
  );
}
