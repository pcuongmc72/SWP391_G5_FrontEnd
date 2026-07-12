import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import RoleBadge from './RoleBadge';

function CommentItem({ comment, onDelete, canDelete }) {
  const { authorFullName: authorName = 'Người dùng', content = '', createdAt, id } = comment;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  return (
    <div style={{
      padding: '1rem', background: '#fff', borderRadius: '1rem',
      border: '1px solid #f1f5f9', marginBottom: '0.75rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 700, border: '1px solid #e2e8f0' }}>
            {authorName[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {authorName}
              <RoleBadge roleData={comment} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={10} /> {formatDate(createdAt)}
            </div>
          </div>
        </div>

        {canDelete && (
          <button onClick={() => onDelete(id)} style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none', background: '#fff1f2', color: '#f43f5e', cursor: 'pointer' }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {content}
      </p>
    </div>
  );
}

export default CommentItem;
