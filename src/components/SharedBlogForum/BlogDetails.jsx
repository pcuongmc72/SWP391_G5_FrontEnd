import React from 'react';
import { 
  X, User, Calendar, Tag, Globe, Lock, 
  ArrowLeft, Clock, BookOpen, GraduationCap 
} from 'lucide-react';
import CommentSection from './CommentSection';

/**
 * BlogDetails — Full screen modal for a blog post and its discussions
 */
function BlogDetails({ blog, onClose }) {
  if (!blog) return null;

  const title = blog.title ?? blog.Title ?? '';
  const content = blog.content ?? blog.Content ?? '';
  const authorName = blog.authorFullName ?? blog.AuthorFullName ?? 'Người dùng';
  const createdAt = blog.createdAt ?? blog.CreatedAt;
  const courseCode = blog.courseCode ?? blog.CourseCode ?? blog.courseName ?? blog.CourseName ?? '';
  const isPublic = (blog.isPublic ?? !blog.IsPrivate) ?? true;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .details-container { max-width: 800px; margin: 0 auto; width: 100%; padding: 2rem 1.5rem; }
      `}</style>

      {/* Sticky Header */}
      <header style={{
        padding: '1rem 1.5rem',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button 
          onClick={onClose}
          style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: '#f1f5f9',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Quay lại danh sách</h2>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="details-container">
          {/* Post Content */}
          <article>
            {/* Meta Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#0D3E26',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: '#ecfdf5',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.625rem',
                border: '1px solid #a7f3d0'
              }}>
                <GraduationCap size={14} />
                {courseCode}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: isPublic ? '#059669' : '#d97706',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: isPublic ? '#ecfdf5' : '#fff7ed',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.625rem',
                border: `1px solid ${isPublic ? '#a7f3d0' : '#ffedd5'}`
              }}>
                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                {isPublic ? 'Bài viết công khai' : 'Thảo luận nội bộ'}
              </div>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                fontSize: '1.25rem',
                fontWeight: 800,
                border: '2px solid #fff',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                {authorName[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{authorName}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} />
                  Đã đăng vào {formatDate(createdAt)}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '1.125rem',
              color: '#334155',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              marginBottom: '3rem',
            }}>
              {content}
            </div>
          </article>

          {/* Comment Section */}
          <CommentSection blogId={blog.id ?? blog.Id} />
        </div>

        {/* Footer info */}
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
