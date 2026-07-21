import React from 'react';
import { 
  Calendar, Tag, ChevronRight, 
  Lock, Globe, Edit2, Trash2,
  Check, X
} from 'lucide-react';
import RoleBadge from './RoleBadge';

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
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap'
      }}>
        {courseName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#047857',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: '#ecfdf5',
            padding: '0.25rem 0.625rem',
            borderRadius: '0.375rem',
            flexShrink: 1,
            minWidth: 0
          }}>
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}>
              {courseName}
            </span>
          </div>
        )}

        {/* Status Badge */}
        {(showStatus || isPendingView || isAdmin) && (
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            {status === 0 && (
              <div style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.7rem', fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>
                🕒 Chờ duyệt
              </div>
            )}
            {status === 1 && (
              <div style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.7rem', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                Đã duyệt
              </div>
            )}
            {status === 2 && (
              <div style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.7rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                Đã từ chối
              </div>
            )}
          </div>
        )}
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
          fontSize: '0.775rem',
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
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.7125rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {authorName}
              <RoleBadge roleData={thread} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={10} />
                {formatDate(createdAt)}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: !isPrivate ? '#059669' : '#d97706' }}>
                {!isPrivate ? <Globe size={10} /> : <Lock size={10} />}
                {!isPrivate ? 'Công khai' : 'Riêng tư'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit/Delete Actions */}
        {(isAdmin || isAuthor) && (
          <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(thread); }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: '#eff6ff',
                color: '#2563eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = '#dbeafe'; 
                e.currentTarget.style.transform = 'scale(1.08)'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = '#eff6ff'; 
                e.currentTarget.style.transform = 'scale(1)'; 
              }}
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(thread.id); }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: '#fff1f2',
                color: '#e11d48',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = '#ffe4e6'; 
                e.currentTarget.style.transform = 'scale(1.08)'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = '#fff1f2'; 
                e.currentTarget.style.transform = 'scale(1)'; 
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Approval Actions Block */}
      {isPendingView && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginTop: '0.25rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #f1f5f9'
        }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); onApprove(thread.id, 1); }}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d1fae5'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ecfdf5'}
          >
            <Check size={14} /> Duyệt
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onApprove(thread.id, 2); }}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#fff1f2',
              color: '#e11d48',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff1f2'}
          >
            <X size={14} /> Từ chối
          </button>
        </div>
      )}
    </div>
  );
}

export default BlogCard;
