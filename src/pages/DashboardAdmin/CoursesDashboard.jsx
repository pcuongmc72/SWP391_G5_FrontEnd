import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, CheckCircle,
  AlertCircle, Loader2, BookOpen, GraduationCap, HelpCircle
} from 'lucide-react';
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse
} from '../../services/courseService';
import { getClasses } from '../../services/classService';


/* ─── Helpers ──────────────────────────────────────────── */
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function iconBtnStyle(bg, color) {
  return {
    width: 28, height: 28, borderRadius: 8,
    background: bg, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color, transition: 'all 0.15s',
    flexShrink: 0,
  };
}

/* ─── CourseCard ────────────────────────────────────────── */
function CourseCard({ course, onEdit, onDelete }) {
  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid #e2e8f0`,
      borderRadius: 20,
      padding: '1.25rem 1.4rem',
      display: 'flex', flexDirection: 'column', gap: 0,
      transition: 'box-shadow 0.2s, transform 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      position: 'relative', overflow: 'hidden',
      minHeight: 210,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(13,62,38,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Decorative top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #0D3E26, #10b981)',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        {course.code && (
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 800,
            color: '#0D3E26', background: '#ecfdf5',
            border: '1px solid #a7f3d0', borderRadius: 6,
            padding: '2px 7px', letterSpacing: '0.06em',
            alignSelf: 'flex-start',
          }}>
            {course.code}
          </span>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(course)}
            title="Chỉnh sửa"
            style={iconBtnStyle('#f8fafc', '#64748b')}>
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(course.id, course.name)}
            title="Xóa"
            style={iconBtnStyle('#fff1f2', '#f43f5e')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Name */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.3 }}>
        {course.name}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px',
        lineHeight: 1.45,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexGrow: 1,
      }}>
        {course.description || <em style={{ color: '#94a3b8' }}>Không có mô tả.</em>}
      </p>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #f1f5f9',
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.72rem',
        color: '#94a3b8',
      }}>
        <span>Ngày tạo:</span>
        <span style={{ fontWeight: 600, color: '#475569' }}>{formatDate(course.createdAt)}</span>
      </div>
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────── */
function EmptyState({ onAdd }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', textAlign: 'center',
      background: '#ffffff', borderRadius: 20, border: '1px dashed #cbd5e1',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <GraduationCap size={30} color="#10b981" />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
        Chưa có môn học nào
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px', maxWidth: 300 }}>
        Thêm môn học đầu tiên để quản lý chương trình giảng dạy của bạn.
      </p>
      <button onClick={onAdd} style={primaryBtnStyle}>
        <Plus size={15} />
        Tạo môn học đầu tiên
      </button>
    </div>
  );
}

/* ─── Shared button styles ───────────────────────────── */
const primaryBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px',
  background: 'linear-gradient(135deg, #0D3E26, #166534)',
  color: '#fff', border: 'none', borderRadius: 12,
  fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(13,62,38,0.25)',
  transition: 'all 0.2s',
  letterSpacing: '0.01em',
};

/* ─── Toast ───────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 1000001,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px',
      background: isError ? '#fff1f2' : '#ecfdf5',
      border: `1px solid ${isError ? '#fecdd3' : '#a7f3d0'}`,
      borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      animation: 'crsSlideUp 0.25s ease',
    }}>
      {isError
        ? <AlertCircle size={17} color="#f43f5e" />
        : <CheckCircle size={17} color="#10b981" />}
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isError ? '#be123c' : '#065f46' }}>
        {toast.message}
      </span>
    </div>
  );
}

/* ─── Modal: Create / Edit ────────────────────────────── */
function CourseModal({ isOpen, editingCourse, courseForm, setCourseForm, onSave, onClose, saving }) {
  if (!isOpen) return null;

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #e2e8f0', borderRadius: 12,
    fontSize: '0.875rem', color: '#0f172a',
    background: '#f8fafc', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = '#10b981';
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
    e.target.style.background = '#ffffff';
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = '#e2e8f0';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#f8fafc';
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'crsFadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 24, padding: '2rem',
        width: '100%', maxWidth: 480,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'crsSlideUp 0.2s ease',
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingCourse ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {editingCourse ? 'Cập nhật thông tin chi tiết môn học' : 'Điền thông tin môn học bên dưới'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ ...iconBtnStyle('#f1f5f9', '#64748b'), width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Code */}
          <div>
            <label style={labelStyle}>Mã môn học <span style={{ color: '#f43f5e' }}>*</span></label>
            <input
              value={courseForm.code}
              onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
              style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}
              placeholder="VD: PRN232"
              onFocus={focusStyle} onBlur={blurStyle}
              disabled={!!editingCourse} // Không cho phép đổi Mã môn học khi chỉnh sửa để bảo toàn khóa
            />
            <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginTop: 4 }}>
              * Viết liền, chỉ chứa chữ cái và chữ số (Không chứa khoảng trắng).
            </span>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Tên môn học <span style={{ color: '#f43f5e' }}>*</span></label>
            <input
              value={courseForm.name}
              onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
              style={inputStyle}
              placeholder="VD: Lập trình C# cơ bản"
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Mô tả môn học</label>
            <textarea
              value={courseForm.description}
              onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Nhập mô tả ngắn gọn về chương trình môn học..."
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button" onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: '0.875rem',
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving
                ? <><Loader2 size={14} style={{ animation: 'crsSpin 1s linear infinite' }} /> Đang lưu...</>
                : editingCourse ? 'Lưu thay đổi' : 'Tạo môn học'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.8125rem',
  fontWeight: 600, color: '#374151', marginBottom: 6,
};

/* ─── MAIN COMPONENT ───────────────────────────────── */
function CoursesDashboard({ showToast, toast }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  /* ── Fetch dữ liệu từ API ── */
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setApiError('');
      const responseData = await fetchCourses();

      let courseList = [];
      if (responseData && responseData.success && Array.isArray(responseData.data)) {
        courseList = responseData.data;
      } else if (Array.isArray(responseData)) {
        courseList = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        courseList = responseData.data;
      } else if (responseData && responseData.$values && Array.isArray(responseData.$values)) {
        courseList = responseData.$values;
      }

      setCourses(courseList);
    } catch (err) {
      setApiError(err.message || 'Không thể kết nối đến Backend để tải danh sách môn học.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [courses, search]);

  /* ── Open modal ── */
  const handleOpen = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({ code: course.code || '', name: course.name || '', description: course.description || '' });
    } else {
      setEditingCourse(null);
      setCourseForm({ code: '', name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  /* ── Save (Create / Update) ── */
  const handleSave = async (e) => {
    e.preventDefault();
    const { code, name, description } = courseForm;
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanDesc = description.trim();

    if (!cleanCode) {
      showToast('Vui lòng điền mã môn học!', 'error'); return;
    }

    // Regex check: alphanumeric, no spaces
    const codeRegex = /^[A-Z0-9]+$/i;
    if (!codeRegex.test(cleanCode)) {
      showToast('Mã môn học chỉ được chứa chữ và số, viết liền (VD: PRN232)!', 'error');
      return;
    }

    if (!cleanName) {
      showToast('Vui lòng điền tên môn học!', 'error'); return;
    }

    try {
      setSaving(true);
      const payload = {
        code: cleanCode,
        name: cleanName,
        description: cleanDesc,
      };

      if (editingCourse) {
        const res = await updateCourse(editingCourse.id, payload);
        showToast(`Đã cập nhật môn học "${cleanName}" thành công!`);
      } else {
        // Tránh trùng mã môn ở phía Client trước
        if (courses.some(c => c.code.toUpperCase() === cleanCode)) {
          showToast('Mã môn học này đã tồn tại trên hệ thống!', 'error');
          return;
        }
        const res = await createCourse(payload);
        showToast(`Đã thêm môn học "${cleanName}" thành công!`);
      }

      setIsModalOpen(false);
      await loadCourses(); // Reload danh sách từ API
    } catch (err) {
      showToast(err.message || 'Lưu môn học thất bại, vui lòng kiểm tra lại!', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id, name) => {
    try {
      // Fetch all classes to check if this course has any classes
      const classesData = await getClasses();
      let allClasses = [];
      if (Array.isArray(classesData)) {
        allClasses = classesData;
      } else if (classesData && Array.isArray(classesData.data)) {
        allClasses = classesData.data;
      } else if (classesData && Array.isArray(classesData.items)) {
        allClasses = classesData.items;
      } else if (classesData && classesData.$values && Array.isArray(classesData.$values)) {
        allClasses = classesData.$values;
      }

      // Check if any class belongs to this course
      const hasClasses = allClasses.some(c => {
        const cCourseId = c.courseId ?? c.CourseId ?? '';
        return String(cCourseId) === String(id);
      });

      if (hasClasses) {
        showToast(`Không thể xóa môn học "${name}" vì đang có lớp học thuộc môn học này!`, 'error');
        return;
      }

      // If no classes, open confirm modal
      setItemToDelete({ id, name });
      setDeleteConfirmOpen(true);
    } catch (err) {
      console.error('Lỗi khi kiểm tra lớp học thuộc môn học:', err);
      // Fallback: Open confirm modal anyway if API check fails
      setItemToDelete({ id, name });
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteCourse(itemToDelete.id);
      showToast(`Đã xóa môn học "${itemToDelete.name}" thành công!`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await loadCourses();
    } catch (err) {
      showToast(err.message || 'Xóa môn học thất bại!', 'error');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes crsSlideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes crsFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes crsSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes confirmFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes confirmScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>

      <Toast toast={toast} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0D3E26 0%, #065f46 60%, #064e3b 100%)',
          borderRadius: 20, padding: '1.5rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          boxShadow: '0 4px 20px rgba(13,62,38,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <GraduationCap size={22} color="#34d399" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Quản lý môn học
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                Định nghĩa môn học, mã môn học và học liệu cốt lõi trên toàn hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpen()}
            style={{ ...primaryBtnStyle, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <Plus size={16} />
            Thêm môn học mới
          </button>
        </div>

        {/* ── API Error Banner ── */}
        {apiError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px',
            background: '#fff1f2', border: '1px solid #fecdd3',
            borderRadius: 14, fontSize: '0.875rem', color: '#be123c', fontWeight: 600,
          }}>
            <AlertCircle size={17} color="#f43f5e" />
            {apiError}
            <button
              onClick={loadCourses}
              style={{
                marginLeft: 'auto', padding: '5px 12px',
                background: '#f43f5e', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '3rem', gap: 12, color: '#64748b', fontSize: '0.875rem',
            background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
          }}>
            <Loader2 size={22} color="#10b981" style={{ animation: 'crsSpin 1s linear infinite' }} />
            Đang tải danh sách môn học...
          </div>
        )}

        {/* ── Toolbar: search ── */}
        {!loading && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm môn học theo Mã hoặc Tên..."
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  border: '1.5px solid #e2e8f0', borderRadius: 12,
                  fontSize: '0.875rem', background: '#fff', outline: 'none',
                  boxSizing: 'border-box', color: '#0f172a',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Cards grid ── */}
        {!loading && (
          filtered.length === 0 ? (
            <EmptyState onAdd={() => handleOpen()} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Modal ── */}
      <CourseModal
        isOpen={isModalOpen}
        editingCourse={editingCourse}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        onSave={handleSave}
        onClose={() => { if (!saving) setIsModalOpen(false); }}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        title="Xóa môn học"
        message={`Bạn có chắc chắn muốn xóa môn học "${itemToDelete?.name || ''}"? Hành động này sẽ xóa môn học khỏi cơ sở dữ liệu và không thể hoàn tác.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { if (!deleting) setDeleteConfirmOpen(false); }}
        confirming={deleting}
      />
      <Toast toast={toast} />
    </>
  );
}

/* ─── Confirm Delete Modal ────────────────────────────── */
function ConfirmDeleteModal({ isOpen, title, message, onConfirm, onCancel, confirming }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'confirmFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{
        background: '#ffffff', borderRadius: 24, padding: '2rem',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
        animation: 'confirmScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center', border: '1px solid #f1f5f9'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #f43f5e, #be123c)',
        }} />

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#fff1f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          border: '1px solid #ffe4e6',
          boxShadow: '0 4px 12px rgba(244, 63, 94, 0.1)'
        }}>
          <Trash2 size={24} color="#e11d48" />
        </div>

        <h3 style={{ margin: '0 0 10px', fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
          {title}
        </h3>

        <p style={{ margin: '0 0 24px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            style={{
              flex: 1, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0',
              background: '#ffffff', color: '#64748b', fontSize: '0.875rem',
              fontWeight: 700, cursor: confirming ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!confirming) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
            onMouseLeave={e => { if (!confirming) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            style={{
              flex: 1, padding: '10px 18px', borderRadius: 12, border: 'none',
              background: confirming ? '#94a3b8' : 'linear-gradient(135deg, #e11d48, #be123c)',
              color: '#ffffff', fontSize: '0.875rem',
              fontWeight: 700, cursor: confirming ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: confirming ? 'none' : '0 4px 14px rgba(225, 29, 72, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
            onMouseEnter={e => { if (!confirming) e.currentTarget.style.background = 'linear-gradient(135deg, #f43f5e, #be123c)'; }}
            onMouseLeave={e => { if (!confirming) e.currentTarget.style.background = 'linear-gradient(135deg, #e11d48, #be123c)'; }}
          >
            {confirming ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Đang xóa...
              </>
            ) : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CoursesDashboard;
