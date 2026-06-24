import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

/**
 * CommentForm — Form to submit a new comment
 */
function CommentForm({ onSubmit, isSubmitting }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      background: '#fff',
      padding: '1.25rem',
      borderRadius: '1rem',
      border: '1px solid #e2e8f0',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    }}>
      <textarea
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Viết bình luận của bạn..."
        style={{
          width: '100%',
          minHeight: '5rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          fontSize: '0.875rem',
          outline: 'none',
          resize: 'vertical',
          background: '#f8fafc',
          color: '#0f172a',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#10b981';
          e.target.style.background = '#fff';
          e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.background = '#f8fafc';
          e.target.style.boxShadow = 'none';
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: isSubmitting || !content.trim() ? '#94a3b8' : 'linear-gradient(135deg, #0D3E26, #166534)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: isSubmitting || !content.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isSubmitting || !content.trim() ? 'none' : '0 4px 12px rgba(13, 62, 38, 0.2)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send size={16} />
              Gửi bình luận
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default CommentForm;
