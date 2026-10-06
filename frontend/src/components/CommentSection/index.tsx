import React, { useState, useEffect } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { Comment } from '../../types';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingView from '../LoadingView';
import FailureView from '../FailureView';

interface CommentSectionProps {
  taskId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch(`/tasks/${taskId}/comments`);
      setComments(res.data.comments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await apiFetch(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() })
      });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  if (isLoading) return <LoadingView message="Loading task discussions..." />;
  if (error) return <FailureView message={error} onRetry={fetchComments} />;

  return (
    <div className="comments-section">
      <div className="comments-header">
        <MessageSquare size={18} className="text-indigo-400" />
        <h4>Task Discussions & Activity ({comments.length})</h4>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => {
            const canDelete =
              user &&
              (user.id === comment.user_id || user.role === 'Admin' || user.role === 'Manager');

            return (
              <div key={comment.id} className="comment-card">
                <img
                  src={
                    comment.user_avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      comment.user_name || 'User'
                    )}&background=4f46e5&color=fff`
                  }
                  alt={comment.user_name}
                  className="comment-avatar"
                />
                <div className="comment-content-wrap">
                  <div className="comment-meta">
                    <span className="comment-author">{comment.user_name}</span>
                    {comment.user_role && (
                      <span className={`role-badge role-${comment.user_role.toLowerCase()}`}>
                        {comment.user_role}
                      </span>
                    )}
                    <span className="comment-time">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="comment-body">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddComment} className="comment-form">
        <input
          type="text"
          className="comment-input"
          placeholder="Add a detailed comment or update status..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />
        <button type="submit" className="comment-submit-btn" disabled={isSubmitting || !newComment.trim()}>
          <Send size={16} />
          <span>Post</span>
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
