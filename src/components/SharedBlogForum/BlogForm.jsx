import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Save, Loader2, Type, AlignLeft,
  Tag, Globe, Lock, AlertCircle, School
} from 'lucide-react';
import { getUserClasses } from '../../services/classService';
import { getUser } from '../../services/authService';

function BlogForm({ isOpen, onClose, onSave, initialData, courses, isSaving }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    classId: '',
    isPublic: true
  });

  const [userClasses, setUserClasses] = useState([]);
  const currentUser = useMemo(() => getUser(), []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        courseId: initialData.courseId || '',
        classId: initialData.classId || '',
        isPublic: !(initialData.isPrivate ?? false)
      });
    } else {
      setFormData({ title: '', content: '', courseId: '', classId: '', isPublic: true });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && currentUser) {
      getUserClasses(currentUser.id)
        .then(res => {
          const list = res.success ? res.data : res;
          setUserClasses(Array.isArray(list) ? list : []);
        })
        .catch(err => console.error('Failed to fetch user classes:', err));
    }
  }, [isOpen, currentUser]);

  const filteredClasses = userClasses.filter(c => c.courseId === formData.courseId);

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
    color: '#0f172a',
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
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}><Type size={16} /> Tiêu đề bài viết</label>
            <input required className="blog-input" style={inputStyle} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: formData.isPublic ? '1fr' : '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}><Tag size={16} /> Thẻ môn học</label>
              <select required className="blog-input" style={inputStyle} value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })}>
                <option value="">Chọn môn học...</option>
                {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
              </select>
            </div>
            {!formData.isPublic && (
              <div>
                <label style={labelStyle}><School size={16} /> Chọn lớp học</label>
                <select required className="blog-input" style={inputStyle} value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}>
                  <option value="">Chọn lớp học...</option>
                  {filteredClasses.map(cls => <option key={cls.id} value={cls.id}>{cls.id}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}><AlignLeft size={16} /> Nội dung thảo luận</label>
            <textarea required className="blog-input" style={{ ...inputStyle, minHeight: '10rem', resize: 'vertical' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {formData.isPublic ? <Globe size={20} color="#10b981" /> : <Lock size={20} color="#f59e0b" />}
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>{formData.isPublic ? 'Công khai' : 'Riêng tư'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formData.isPublic ? 'Tất cả mọi người đều có xem' : 'Chỉ thành viên trong lớp'}</div>
              </div>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })} style={{ width: '3.5rem', height: '1.75rem', borderRadius: '2rem', border: 'none', background: formData.isPublic ? '#10b981' : '#cbd5e1', cursor: 'pointer', transition: 'all 0.3s' }}>
              <div style={{ position: 'absolute', top: '0.2rem', left: formData.isPublic ? '1.95rem' : '0.25rem', width: '1.35rem', height: '1.35rem', borderRadius: '50%', background: '#fff' }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} disabled={isSaving} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
            <button type="submit" disabled={isSaving} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: isSaving ? '#94a3b8' : '#0D3E26', color: '#fff', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
               {isSaving ? 'Đang lưu...' : 'Lưu bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BlogForm;
