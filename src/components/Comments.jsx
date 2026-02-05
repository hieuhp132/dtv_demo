import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Comments.css";

export default function Comments({ jobId, isAdmin }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Load comments from localStorage
  useEffect(() => {
    const savedComments = localStorage.getItem(`comments_${jobId}`);
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    }
  }, [jobId]);

  // Save comments to localStorage
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem(`comments_${jobId}`, JSON.stringify(comments));
    }
  }, [comments, jobId]);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const newComment = {
      id: Date.now(),
      text: commentText,
      author: user.name || user.email,
      authorRole: user.role,
      timestamp: new Date().toISOString(),
      userId: user.id || user.email,
    };

    setComments([newComment, ...comments]);
    setCommentText("");
  };

  const handleDeleteComment = (id) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    setComments(comments.filter((c) => c.id !== id));
  };

  const handleEditComment = (id) => {
    const comment = comments.find((c) => c.id === id);
    if (comment) {
      setEditingId(id);
      setEditText(comment.text);
    }
  };

  const handleSaveEdit = (id) => {
    setComments(
      comments.map((c) =>
        c.id === id
          ? {
              ...c,
              text: editText,
              editedAt: new Date().toISOString(),
            }
          : c
      )
    );
    setEditingId(null);
    setEditText("");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "#ef4444",
      recruiter: "#3b82f6",
      user: "#6b7280",
    };
    return colors[role] || "#6b7280";
  };

  return (
    <div className="comments-section">
      <h3>Comments & Discussion</h3>

      {/* Add Comment Form */}
      {user && (
        <form className="add-comment-form" onSubmit={handleAddComment}>
          <textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows="3"
          />
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="btn-submit"
          >
            Post Comment
          </button>
        </form>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="author-name">{comment.author}</span>
                  <span
                    className="author-role"
                    style={{ backgroundColor: getRoleBadge(comment.authorRole) }}
                  >
                    {comment.authorRole}
                  </span>
                </div>
                <span className="comment-time">
                  {formatDate(comment.timestamp)}
                  {comment.editedAt && " (edited)"}
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="edit-comment">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows="3" />
                  <div className="edit-actions">
                    <button onClick={() => handleSaveEdit(comment.id)} className="btn-save">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.text}</p>
              )}

              {(isAdmin || user?.id === comment.userId || user?.email === comment.userId) && (
                <div className="comment-actions">
                  {editingId !== comment.id && (
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
