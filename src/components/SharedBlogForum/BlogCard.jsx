import React from 'react';
import { 
  Calendar, Tag, ChevronRight, 
  Lock, Globe, Edit2, Trash2 
} from 'lucide-react';

function BlogCard({ thread, onClick, onEdit, onDelete, onApprove, isAdmin, isPendingView, isAuthor, showStatus }) {
  const title = thread.title ?? thread.Title ?? '';
  const content = thread.content ?? thread.Content ?? '';
  const authorName = thread.authorFullName ?? thread.AuthorFullName ?? thread.authorName ?? thread.AuthorName ?? 'Người dùng';
  const createdAt = thread.createdAt ?? thread.CreatedAt;
  const isPrivate = thread.isPrivate ?? thread.IsPrivate ?? false;
  const status = thread.status ?? thread.Status ?? 0;
  const courseName = thread.courseName ?? thread.CourseName ?? '';

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  return (
    <div 
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(13, 62, 38, 0.08)';
        e.currentTarget.style.borderColor = '#10b98133';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Header: Course Tag + Badges */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '0.5rem'
      }}>
        {courseName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#0D3E26',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: '#ecfdf5',
            padding: '0.35rem 0.75rem',
            borderRadius: '0.625rem',
            border: '1px solid #a7f3d0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px'
          }}>
            <Tag size={12} />
            {courseName}
          </div>
        )}

        {/* Visibility & Status Badges */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.4rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <div style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '2rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: !isPrivate ? '#ecfdf5' : '#fff7ed',
              color: !isPrivate ? '#059669' : '#d97706',
              border: `1px solid ${!isPrivate ? '#a7f3d0' : '#ffedd5'}`,
            }}>
              {!isPrivate ? <Globe size={12} /> : <Lock size={12} />}
              {!isPrivate ? 'Công khai' : 'Riêng tư'}
            </div>

            {/* Status Badge */}
            {(showStatus || isPendingView || isAdmin) && (
              <>
                {status === 0 && (
                  <div style={{ padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                    🕒 Đang chờ duyệt
                  </div>
                )}
                {status === 1 && (
                  <div style={{ padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    ✅ Đã duyệt
                  </div>
                )}
                {status === 2 && (
                  <div style={{ padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    ❌ Đã từ chối
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Title & Content */}
      <div>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '0.5rem',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {content}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: '1px solid #e2e8f0'
          }}>
            {authorName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
              {authorName}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={10} />
              {formatDate(createdAt)}
            </div>
          </div>
        </div>

        {/* Approval Actions */}
        {isPendingView && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(thread.id, 1); }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Duyệt
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(thread.id, 2); }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#fff1f2',
                color: '#e11d48',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Từ chối
            </button>
          </div>
        )}

        {/* Edit/Delete Actions */}
        {(isAdmin || isAuthor) && (
          <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(thread); }}
              style={{
                padding: '0.4rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(thread.id); }}
              style={{
                padding: '0.4rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#fff1f2',
                color: '#f43f5e',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe4e6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogCard;
