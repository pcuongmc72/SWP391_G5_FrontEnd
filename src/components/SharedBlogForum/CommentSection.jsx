import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { fetchComments, createComment, deleteComment } from '../../services/blogService';
import { getUser, getRole } from '../../services/authService';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

/**
 * CommentSection — Manages comment lifecycle for a blog post
 */
function CommentSection({ blogId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = getUser();
  const userRole = getRole();
  const isAdmin = userRole === 'admin';

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchComments(blogId);
      
      // Handle PascalCase and potential wrapping
      let commentList = [];
      const data = res.success ? res.data : res;
      if (Array.isArray(data)) commentList = data;
      else if (data?.$values) commentList = data.$values;

      setComments(commentList);
      setError(null);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Không thể tải bình luận.');
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async (content) => {
    if (!currentUser) {
      alert('Bạn cần đăng nhập để bình luận.');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        BlogId: blogId,
        AuthorId: currentUser.id ?? currentUser.Id,
        Content: content
      };
      await createComment(payload);
      await loadComments();
    } catch (err) {
      alert('Không thể gửi bình luận: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await deleteComment(id);
      await loadComments();
    } catch (err) {
      alert('Không thể xóa bình luận: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <MessageSquare size={20} color="#0D3E26" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Thảo luận ({comments.length})
        </h3>
      </div>

      <CommentForm onSubmit={handleAddComment} isSubmitting={isSubmitting} />

      {loading && comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
          <span>Đang tải bình luận...</span>
        </div>
      ) : error ? (
        <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '0.75rem', color: '#be123c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      ) : comments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {comments.map(comment => (
            <CommentItem 
              key={comment.id ?? comment.Id} 
              comment={comment}
              onDelete={handleDeleteComment}
              canDelete={isAdmin || (comment.authorId ?? comment.AuthorId) === (currentUser?.id ?? currentUser?.Id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0', color: '#64748b' }}>
          Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
        </div>
      )}
    </div>
  );
}

export default CommentSection;
