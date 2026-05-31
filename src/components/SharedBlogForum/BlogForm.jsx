import React, { useState, useEffect } from 'react';
import {
  X, Save, Loader2, Type, AlignLeft,
  Tag, Globe, Lock, AlertCircle
} from 'lucide-react';

/**
 * BlogForm — Modal for creating or editing a blog entry
 */
function BlogForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  courses,
  isSaving
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    isPublic: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || initialData.Title || '',
        content: initialData.content || initialData.Content || '',
        courseId: initialData.courseId || initialData.CourseId || '',
        isPublic: initialData.isPublic ?? !(initialData.isPrivate ?? initialData.IsPrivate ?? false)
      });
    } else {
      setFormData({
        title: '',
        content: '',
        courseId: '',
        isPublic: true
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
    background: '#f8fafc',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.5rem',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .blog-input:focus { border-color: #10b981 !important; background: #fff !important; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important; }
      `}</style>

      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: '36rem',
        borderRadius: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fcfdfd'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {initialData ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Chia sẻ kiến thức và thảo luận về chủ đề môn học
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}><Type size={16} /> Tiêu đề bài viết</label>
            <input
              required
              className="blog-input"
              style={inputStyle}
              placeholder="VD: Kinh nghiệm học môn PRN231 hiệu quả..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Course Tag Select */}
          <div>
            <label style={labelStyle}><Tag size={16} /> Gắn thẻ môn học</label>
            <select
              required
              className="blog-input"
              style={inputStyle}
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            >
              <option value="">Chọn môn học...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  [{course.code}] {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle}><AlignLeft size={16} /> Nội dung thảo luận</label>
            <textarea
              required
              className="blog-input"
              style={{ ...inputStyle, minHeight: '12rem', resize: 'vertical' }}
              placeholder="Viết nội dung bài viết ở đây..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Visibility Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '1rem',
            border: '1px border #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: formData.isPublic ? '#ecfdf5' : '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: formData.isPublic ? '#10b981' : '#f59e0b',
              }}>
                {formData.isPublic ? <Globe size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                  {formData.isPublic ? 'Công khai' : 'Riêng tư'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {formData.isPublic ? 'Tất cả mọi người đều có thể xem' : 'Chỉ thành viên trong lớp mới có thể xem'}
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              style={{
                width: '3.5rem',
                height: '1.75rem',
                borderRadius: '2rem',
                border: 'none',
                background: formData.isPublic ? '#10b981' : '#cbd5e1',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '0.2rem',
                left: formData.isPublic ? '1.95rem' : '0.25rem',
                width: '1.35rem',
                height: '1.35rem',
                borderRadius: '50%',
                background: '#fff',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </button>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '0.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: isSaving ? '#94a3b8' : 'linear-gradient(135deg, #0D3E26, #166534)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: isSaving ? 'none' : '0 4px 12px rgba(13, 62, 38, 0.2)',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Lưu bài viết
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BlogForm;
