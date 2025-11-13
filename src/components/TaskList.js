import React, { useContext, useState, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import axios from "axios";
import TaskDetailModal from "./TaskDetailModal";
import "./TaskList.css";

export default function TaskList({ statusFilter, priorityFilter, displayTasks }) {
  console.log("All tasks:", displayTasks);

  const [showRecurrentEnd, setShowRecurrentEnd] = useState(false);
  const [endedTaskTitle, setEndedTaskTitle] = useState("");

  useEffect(() => {
    if (!displayTasks || showRecurrentEnd) return;
    const now = new Date();
    for (const task of displayTasks) {
      if (
        (task.isRecurrent || (task.recurrencePattern && task.recurrencePattern !== "none")) &&
        task.recurrenceEndDate &&
        new Date(task.recurrenceEndDate) <= now &&
        task.status !== "done"
      ) {
        setShowRecurrentEnd(true);
        setEndedTaskTitle(task.title);
        break;
      }
    }
  }, [displayTasks, showRecurrentEnd]);

  const [expandedTask, setExpandedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [logTaskId, setLogTaskId] = useState(null);

  const { updateTask, deleteTask, fetchTasks } = useContext(TaskContext);
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id || user?._id;

  // ---------------- PAGINATION ----------------
  const [page, setPage] = useState(1);
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

  const handleMarkDone = (task) => {
    const id = task._id || task.id;

    if (
      (task.isRecurrent || (task.recurrencePattern && task.recurrencePattern !== "none")) &&
      task.recurrenceEndDate &&
      task.dueDate &&
      new Date(task.dueDate).toDateString() === new Date(task.recurrenceEndDate).toDateString()
    ) {
      setShowRecurrentEnd(true);
      setEndedTaskTitle(task.title);
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

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`/api/tasks/${taskId}/comments`, {
        text: commentText,
        username: user.username,
        userId: currentUserId,
        userRole: user.role,
      });
      setCommentText("");
      fetchTasks();
    } catch (error) {
      console.error("Error adding comment:", error);
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
              padding: "8px 22px",
              fontWeight: 600,
              fontSize: "1em",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
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
                            deleteTask(id);
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
                                    {comment.text}
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
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddComment(id)
                          }
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
    </>
  );
}
