import React from 'react';
import { 
  X, Calendar, Globe, Lock, 
  ArrowLeft, BookOpen, GraduationCap, Edit2, Trash2 
} from 'lucide-react';
import CommentSection from './CommentSection';
import RoleBadge from './RoleBadge';

function BlogDetails({ blog, onBack, onEdit, onDelete, isAdmin, isAuthor }) {
  if (!blog) return null;

  const { title = '', content = '', authorFullName: authorName = 'Người dùng', createdAt, isPrivate } = blog;
  const courseName = blog.courseName || '';
  const isPublic = !isPrivate;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  return (
    <div 
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.4s ease-out',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .details-container { max-width: 800px; margin: 0 auto; width: 100%; padding: 1rem 0; }
      `}</style>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div className="details-container">
          <button 
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              marginBottom: '2rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={14} /> Quay lại danh sách
          </button>
          
          {(isAdmin || isAuthor) && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', float: 'right' }}>
              <button 
                onClick={() => onEdit(blog)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
              <button 
                onClick={() => onDelete(blog.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 10,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#be123c',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Trash2 size={14} /> Xóa bài
              </button>
            </div>
          )}
          <div style={{ clear: 'both' }}></div>

          <article>
            {/* Meta Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                color: '#0D3E26', fontSize: '0.75rem', fontWeight: 700,
                background: '#ecfdf5', padding: '0.4rem 0.75rem',
                borderRadius: '0.625rem', border: '1px solid #a7f3d0'
              }}>
                <GraduationCap size={14} />
                {courseName}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                color: isPublic ? '#059669' : '#d97706',
                fontSize: '0.75rem', fontWeight: 700,
                background: isPublic ? '#ecfdf5' : '#fff7ed',
                padding: '0.4rem 0.75rem', borderRadius: '0.625rem',
                border: `1px solid ${isPublic ? '#a7f3d0' : '#ffedd5'}`
              }}>
                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                {isPublic ? 'Bài viết công khai' : 'Thảo luận nội bộ'}
              </div>
            </div>

            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 900, 
              color: '#0f172a', 
              marginBottom: '1.5rem', 
              lineHeight: 1.2, 
              letterSpacing: '-0.02em',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              {title}
            </h1>

            {/* Author Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: '3rem', height: '3rem', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', fontSize: '1.25rem', fontWeight: 800,
                border: '2px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                {authorName[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {authorName}
                    <RoleBadge roleData={blog} />
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={13} />
                    Đã đăng vào {formatDate(createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{
              fontSize: '1.125rem', color: '#334155', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', marginBottom: '3rem',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              {content}
            </div>
          </article>

          {/* Comments */}
          <CommentSection blogId={blog.id} />
        </div>

        <footer style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
             <BookOpen size={16} />
             <span>Flipped LMS Discussion System</span>
          </div>
          <p>© 2026 Toàn bộ quyền sở hữu nội dung thuộc về tác giả.</p>
        </footer>
      </div>
    </div>
  );
}

export default BlogDetails;
