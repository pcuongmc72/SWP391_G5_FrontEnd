import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, Search, Users, BookOpen, Edit2, Trash2,
  X, CheckCircle, AlertCircle, GraduationCap,
  CalendarDays, Calendar, Milestone, Loader2,
} from 'lucide-react';
import { fetchCourses } from '../../services/courseService';
import {
  getClasses,
  createClass as createClassApi,
  updateClass as updateClassApi,
  deleteClass as deleteClassApi,
  getClassStudents,
  addStudentToClass,
  removeStudentFromClass,
} from '../../services/classService';

/* ─── Helpers ─────────────────────────────────────────── */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const TERM_STATUS_MAP = {
  ACTIVE: { label: 'Đang diễn ra', color: '#10b981', dot: '#10b981' },
  UPCOMING: { label: 'Sắp tới', color: '#f59e0b', dot: '#f59e0b' },
  COMPLETED: { label: 'Đã kết thúc', color: '#94a3b8', dot: '#94a3b8' },
};

const CLASS_STATUS_MAP = {
  ACTIVE: { label: 'Đang mở', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981' },
  CLOSED: { label: 'Đã đóng', color: '#94a3b8', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' },
  UPCOMING: { label: 'Sắp khai giảng', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
};

/* ─── Normalize class data from API ─────────────────────── */
const normalizeClass = (c) => {
  const rawLec = c.lecturer ?? c.Lecturer ?? c.lecturerName ?? c.LecturerName ?? '';
  const lecName = (rawLec === 'N/A' || !rawLec) ? '' : rawLec;
  const rawLecId = c.lecturerId ?? c.LecturerId ?? '';
  const lecId = (rawLecId === 'N/A' || !rawLecId) ? '' : rawLecId;

  const startDateStr = ((c.startDate ?? c.StartDate) || '').substring(0, 10);
  const endDateStr = ((c.endDate ?? c.EndDate) || '').substring(0, 10);

  // Tính toán trạng thái động dựa trên ngày hiện tại
  let computedStatus = 'ACTIVE';
  if (startDateStr && endDateStr) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const start = new Date(startDateStr);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();

    const end = new Date(endDateStr);
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    if (today < startDay) {
      computedStatus = 'UPCOMING';
    } else if (today > endDay) {
      computedStatus = 'CLOSED';
    } else {
      computedStatus = 'ACTIVE';
    }
  }

  return {
    id: c.id ?? c.Id ?? '',
    code: c.code ?? c.Code ?? c.classCode ?? c.ClassCode ?? c.id ?? c.Id ?? '',
    name: c.name ?? c.Name ?? c.code ?? c.Code ?? c.id ?? c.Id ?? '',
    courseId: c.courseId ?? c.CourseId ?? '',
    courseCode: c.courseCode ?? c.CourseCode ?? '',
    courseName: c.courseName ?? c.CourseName ?? c.courseCode ?? c.CourseCode ?? 'N/A',
    lecturer: lecName,
    lecturerId: lecId,
    startDate: startDateStr,
    endDate: endDateStr,
    maxStudents: c.maxStudents ?? c.MaxStudents ?? 30,
    room: c.room ?? c.Room ?? '',
    status: computedStatus,
    enrolled: c.enrolled ?? c.Enrolled ?? c.studentCount ?? c.StudentCount ?? c.totalStudents ?? c.TotalStudents ?? 0,
    // Backend dùng academicTermId
    termId: c.academicTermId ?? c.AcademicTermId ?? c.termId ?? c.TermId ?? '',
    students: [],
  };
};

/* ─── Shared styles ────────────────────────────────────── */
function iconBtnStyle(bg, color) {
  return {
    width: 28, height: 28, borderRadius: 8,
    background: bg, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color, transition: 'all 0.15s', flexShrink: 0,
  };
}

const primaryBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px',
  background: 'linear-gradient(135deg, #0D3E26, #166534)',
  color: '#fff', border: 'none', borderRadius: 12,
  fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(13,62,38,0.25)',
  transition: 'all 0.2s', letterSpacing: '0.01em',
};

const labelStyle = {
  display: 'block', fontSize: '0.8125rem',
  fontWeight: 600, color: '#374151', marginBottom: 6,
};

/* ─── Sub-components ─────────────────────────────────── */
function ClassStatusBadge({ status }) {
  const cfg = CLASS_STATUS_MAP[status] || CLASS_STATUS_MAP.CLOSED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: cfg.dot,
        boxShadow: status === 'ACTIVE' ? `0 0 0 3px ${cfg.border}` : 'none',
        animation: status === 'ACTIVE' ? 'clsPulse 2s infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {icon}
      <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 72 }}>{label}:</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{value}</span>
    </div>
  );
}

/* ─── ClassCard ────────────────────────────────────────── */
function ClassCard({ cls, onEdit, onDelete, onViewDetails, onViewRoadmap }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20,
      padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      position: 'relative', overflow: 'hidden',
      minHeight: 330,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(13,62,38,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <ClassStatusBadge status={cls.status} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            onClick={() => onEdit(cls)} 
            title={cls.status === 'CLOSED' ? "Lớp học đã đóng - Không thể chỉnh sửa" : "Chỉnh sửa"} 
            disabled={cls.status === 'CLOSED'}
            style={iconBtnStyle(
              cls.status === 'CLOSED' ? '#f1f5f9' : '#f8fafc', 
              cls.status === 'CLOSED' ? '#cbd5e1' : '#64748b'
            )}
          >
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(cls.id, cls.courseName || cls.code)} title="Xóa" style={iconBtnStyle('#fff1f2', '#f43f5e')}><Trash2 size={13} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {cls.code && (
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 800,
            color: '#0D3E26', background: '#ecfdf5',
            border: '1px solid #a7f3d0', borderRadius: 6,
            padding: '2px 7px', letterSpacing: '0.06em',
          }}>Lớp: {cls.code}</span>
        )}
        {cls.courseCode && (
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 800,
            color: '#2563eb', background: '#eff6ff',
            border: '1px solid #bfdbfe', borderRadius: 6,
            padding: '2px 7px', letterSpacing: '0.06em',
          }}>Môn: {cls.courseCode}</span>
        )}
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
        {cls.courseName || cls.courseCode || 'Chưa chọn môn học'}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
        <InfoRow icon={<GraduationCap size={13} color="#10b981" />} label="Giảng viên" value={cls.lecturer || '—'} />
        <InfoRow icon={<Users size={13} color="#10b981" />} label="Sĩ số" value={`${cls.enrolled ?? 0} sinh viên`} />
        <InfoRow icon={<CalendarDays size={13} color="#f59e0b" />} label="Bắt đầu" value={formatDate(cls.startDate)} />
        <InfoRow icon={<CalendarDays size={13} color="#94a3b8" />} label="Kết thúc" value={formatDate(cls.endDate)} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button
          onClick={() => onViewRoadmap(cls)}
          style={{
            flex: 1, padding: '10px 12px', background: '#ecfdf5', color: '#065f46',
            border: '1.5px solid #a7f3d0', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#d1fae5'; e.currentTarget.style.borderColor = '#0D3E26'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
        >
          <Milestone size={14} />Lộ trình
        </button>

        <button
          onClick={() => onViewDetails(cls)}
          style={{
            flex: 1.2, padding: '10px 12px',
            background: 'linear-gradient(135deg, #0D3E26, #166534)',
            color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, boxShadow: '0 2px 8px rgba(13,62,38,0.15)', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #166534, #15803d)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,62,38,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #0D3E26, #166534)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,62,38,0.15)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Users size={14} />Phân lớp
        </button>
      </div>
    </div>
  );
}

/* ─── ClassDetailModal (API-integrated) ────────────────── */
function ClassDetailModal({ isOpen, cls, users = [], onSaveDetails, onClose }) {
  const isClosed = cls?.status === 'CLOSED';
  const [localLecturer, setLocalLecturer] = useState('');
  const [localStudents, setLocalStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lecturerIdInput, setLecturerIdInput] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');

  const [searchedStudent, setSearchedStudent] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchedLecturer, setSearchedLecturer] = useState(null);
  const [lecturerSearchError, setLecturerSearchError] = useState('');
  const [enrolledSearchTerm, setEnrolledSearchTerm] = useState('');

  const lecturersList = users.filter(u => u.role === 'Lecturer' && u.status === 'ACTIVE');
  const studentsList = users.filter(u => u.role === 'Student' && u.status === 'ACTIVE');

  /* Load students from API whenever modal opens for a class */
  useEffect(() => {
    if (!isOpen || !cls) return;

    // Reset form
    setLocalLecturer(cls.lecturer || '');
    setStudentIdInput('');
    setLecturerIdInput('');
    setSearchedStudent(null);
    setSearchError('');
    setSearchedLecturer(null);
    setLecturerSearchError('');
    setEnrolledSearchTerm('');
    setSaving(false);

    // Pre-fill lecturer
    const matchingLec = lecturersList.find(l => l.name === cls.lecturer);
    if (matchingLec) {
      setLecturerIdInput(String(matchingLec.id));
      setSearchedLecturer(matchingLec);
    }

    // Fetch students via API
    setLoadingStudents(true);
    getClassStudents(cls.id)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && data.$values && Array.isArray(data.$values)) list = data.$values;

        const normalized = list.map(s => ({
          id: s.studentId ?? s.StudentId ?? s.id ?? s.Id ?? s.userId ?? s.UserId ?? '',
          name: s.fullName ?? s.FullName ?? s.name ?? s.Name ?? 'Sinh viên',
          email: s.email ?? s.Email ?? '',
          role: 'Student',
        }));
        setLocalStudents(normalized);
        setOriginalStudents(normalized);
      })
      .catch(err => {
        console.error('Error loading class students:', err);
        // Fallback
        setLocalStudents([]);
        setOriginalStudents([]);
      })
      .finally(() => setLoadingStudents(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls?.id, isOpen]);

  if (!isOpen || !cls) return null;

  const currentStudents = localStudents;

  const filteredCurrentStudents = currentStudents.filter(s =>
    !enrolledSearchTerm.trim() ||
    s.name.toLowerCase().includes(enrolledSearchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(enrolledSearchTerm.toLowerCase()) ||
    String(s.id).toLowerCase().includes(enrolledSearchTerm.toLowerCase())
  );

  const availableStudents = studentsList.filter(s => !currentStudents.some(cs => cs.id === s.id));

  /* ── Handlers ── */
  const handleSearchLecturer = () => {
    const trimmed = lecturerIdInput.trim();
    if (!trimmed) return;
    const lecturer = lecturersList.find(l => String(l.id).toLowerCase() === trimmed.toLowerCase());
    if (!lecturer) {
      setLecturerSearchError(`Không tìm thấy giảng viên với mã ID "${trimmed}"!`);
      setSearchedLecturer(null);
      return;
    }
    setSearchedLecturer(lecturer);
    setLecturerSearchError('');
  };

  const handleCommitAssignLecturer = () => {
    if (!searchedLecturer) return;
    setLocalLecturer(searchedLecturer.name);
  };

  const handleSearchStudent = () => {
    const trimmed = studentIdInput.trim();
    if (!trimmed) return;
    const student = studentsList.find(s => String(s.id).toLowerCase() === trimmed.toLowerCase());
    if (!student) {
      setSearchError(`Không tìm thấy học viên với mã ID "${trimmed}"!`);
      setSearchedStudent(null);
      return;
    }
    if (localStudents.some(cs => cs.id === student.id)) {
      setSearchError(`Học viên "${student.name}" đã có trong lớp học này!`);
      setSearchedStudent(null);
      return;
    }
    setSearchedStudent(student);
    setSearchError('');
  };

  const handleCommitAddStudent = () => {
    if (!searchedStudent) return;
    setLocalStudents(prev => [...prev, searchedStudent]);
    setSearchedStudent(null);
    setStudentIdInput('');
  };

  const handleRemove = (studentId) => {
    setLocalStudents(prev => prev.filter(s => s.id !== studentId));
  };

  /* ── Save: compute diff → call APIs ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      // Students to add (in local but not in original)
      const toAdd = localStudents.filter(s => !originalStudents.some(os => os.id === s.id));
      // Students to remove (in original but not in local)
      const toRemove = originalStudents.filter(s => !localStudents.some(ls => ls.id === s.id));

      for (const student of toAdd) {
        await addStudentToClass(cls.id, student.id);
      }
      for (const student of toRemove) {
        await removeStudentFromClass(cls.id, student.id);
      }

      // Update class lecturer if changed
      if (localLecturer !== (cls.lecturer || '')) {
        const matchedLec = localLecturer ? lecturersList.find(l => l.name === localLecturer) : null;
        const lecId = matchedLec ? matchedLec.id : null;
        await updateClassApi(cls.id, {
          id: cls.id,                        // backend dùng Id = mã lớp
          courseId: cls.courseId,
          academicTermId: cls.termId,        // backend field đúng
          lecturerId: lecId,
          allowReviewAfterEnd: false,
        });
      }

      onSaveDetails(cls.id, localLecturer, localStudents);
      onClose();
    } catch (err) {
      console.error('Error saving class details:', err);
      alert(`Lỗi khi lưu thông tin lớp học:\n${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarBg = (id) => {
    const colors = ['#10b981', '#0D3E26', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#06b6d4', '#6366f1'];
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'clsFadeIn 0.18s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '2rem',
        width: '100%', maxWidth: 980,
        boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        animation: 'clsSlideUp 0.22s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={22} color="#0D3E26" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Chi tiết & Phân lớp: {cls.name || cls.code}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                Mã lớp: <span style={{ fontWeight: 700, color: '#0D3E26' }}>{cls.code}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...iconBtnStyle('#f1f5f9', '#64748b'), width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {/* Warning banner for closed class */}
        {isClosed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', background: '#fff1f2',
            border: '1px solid #fecdd3', borderRadius: 14,
            fontSize: '0.82rem', color: '#be123c', fontWeight: 600,
            marginBottom: 20
          }}>
            <AlertCircle size={17} color="#f43f5e" style={{ flexShrink: 0 }} />
            <span>Lớp học này đã kết thúc. Bạn chỉ có thể xem danh sách lớp học và không thể thêm giảng viên, sinh viên hoặc thực hiện bất kỳ thay đổi nào.</span>
          </div>
        )}

        {/* 2-Column Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, alignItems: 'start' }}>

          {/* Left: Class Info + Lecturer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Info Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 800, color: '#0D3E26' }}>Thông Tin Chung</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <InfoRow icon={<CalendarDays size={14} color="#10b981" />} label="Khai giảng" value={formatDate(cls.startDate)} />
                <InfoRow icon={<CalendarDays size={14} color="#f43f5e" />} label="Bế giảng" value={formatDate(cls.endDate)} />
                <InfoRow icon={<Users size={14} color="#3b82f6" />} label="Sĩ số hiện tại" value={`${currentStudents.length} sinh viên`} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 72 }}>Trạng thái:</span>
                  <ClassStatusBadge status={cls.status} />
                </div>
              </div>
            </div>

            {/* Lecturer Assignment */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 800, color: '#0D3E26', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={16} /> Giảng viên giảng dạy
              </h4>

              <label style={{ ...labelStyle, fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>Chọn giảng viên phụ trách từ danh sách</label>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select
                  value={lecturerIdInput}
                  onChange={e => {
                    const val = e.target.value;
                    setLecturerIdInput(val);
                    const lecturer = lecturersList.find(l => String(l.id) === val);
                    if (lecturer) {
                      setSearchedLecturer(lecturer);
                      setLecturerSearchError('');
                    } else {
                      setSearchedLecturer(null);
                    }
                  }}
                  disabled={isClosed}
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.875rem', color: '#0f172a', background: isClosed ? '#f1f5f9' : '#ffffff', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box', cursor: isClosed ? 'not-allowed' : 'pointer' }}
                  onFocus={e => { if (!isClosed) e.target.style.borderColor = '#10b981'; }}
                  onBlur={e => { if (!isClosed) e.target.style.borderColor = '#e2e8f0'; }}
                >
                  <option value="">-- Chọn giảng viên giảng dạy --</option>
                  {lecturersList.map(l => (
                    <option key={l.id} value={l.id}>{l.name} [ID: {l.id}]</option>
                  ))}
                </select>
              </div>


              {searchedLecturer && (
                <div style={{ padding: '12px 14px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                      {getInitials(searchedLecturer.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {searchedLecturer.name} <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>[ID: {searchedLecturer.id}]</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{searchedLecturer.email}</div>
                    </div>
                  </div>
                  {localLecturer !== searchedLecturer.name ? (
                    <button 
                      onClick={handleCommitAssignLecturer} 
                      disabled={isClosed}
                      style={{ 
                        padding: '6px 12px', 
                        background: isClosed ? '#cbd5e1' : 'linear-gradient(135deg, #0D3E26, #166534)', 
                        color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, 
                        cursor: isClosed ? 'not-allowed' : 'pointer', transition: 'all 0.15s', flexShrink: 0 
                      }}
                      onMouseEnter={e => { if (!isClosed) e.currentTarget.style.background = 'linear-gradient(135deg, #166534, #15803d)'; }}
                      onMouseLeave={e => { if (!isClosed) e.currentTarget.style.background = 'linear-gradient(135deg, #0D3E26, #166534)'; }}>
                      Gán vào lớp
                    </button>
                  ) : (
                    <div style={{ padding: '4px 8px', background: '#d1fae5', color: '#065f46', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle size={10} color="#10b981" /> Đã gán
                    </div>
                  )}
                </div>
              )}

              {lecturerSearchError && (
                <div style={{ padding: '10px 12px', background: '#fff1f2', borderRadius: 10, border: '1px solid #fecdd3', fontSize: '0.78rem', color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <AlertCircle size={14} color="#f43f5e" />{lecturerSearchError}
                </div>
              )}

              {localLecturer ? (
                (() => {
                  const matchedLec = lecturersList.find(l => l.name === localLecturer);
                  return (
                    <div style={{ padding: '10px 12px', background: '#ecfdf5', borderRadius: 10, fontSize: '0.78rem', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Giảng viên phụ trách: {localLecturer}
                        {matchedLec && <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>[ID: {matchedLec.id}]</span>}
                      </div>
                      {!isClosed && (
                        <button onClick={() => { setLocalLecturer(''); setLecturerIdInput(''); setSearchedLecturer(null); setLecturerSearchError(''); }} title="Bỏ gán giảng viên" style={iconBtnStyle('#fee2e2', '#ef4444')}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fecaca'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div style={{ padding: '10px 12px', background: '#fffbeb', borderRadius: 10, fontSize: '0.78rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} color="#f59e0b" />Lớp học hiện tại chưa có giảng viên phụ trách.
                </div>
              )}
            </div>
          </div>

          {/* Right: Students */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 380 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 800, color: '#0D3E26', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} /> Danh sách sinh viên ({currentStudents.length})
            </h4>

            {/* Add Student */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <label style={{ ...labelStyle, fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>Chọn học viên từ danh sách để thêm vào lớp</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={studentIdInput}
                  onChange={e => {
                    const val = e.target.value;
                    setStudentIdInput(val);
                    const student = availableStudents.find(s => String(s.id) === val);
                    if (student) {
                      setSearchedStudent(student);
                      setSearchError('');
                    } else {
                      setSearchedStudent(null);
                    }
                  }}
                  disabled={isClosed}
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.875rem', color: '#0f172a', background: isClosed ? '#f1f5f9' : '#ffffff', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box', cursor: isClosed ? 'not-allowed' : 'pointer' }}
                  onFocus={e => { if (!isClosed) e.target.style.borderColor = '#10b981'; }}
                  onBlur={e => { if (!isClosed) e.target.style.borderColor = '#e2e8f0'; }}
                >
                  <option value="">-- Chọn sinh viên để thêm --</option>
                  {availableStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} [ID: {s.id}]</option>
                  ))}
                </select>
              </div>

              {searchedStudent && (
                <div style={{ marginTop: 10, padding: '12px 14px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                      {getInitials(searchedStudent.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {searchedStudent.name} <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>[ID: {searchedStudent.id}]</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{searchedStudent.email}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleCommitAddStudent} 
                    disabled={isClosed}
                    style={{ 
                      padding: '6px 12px', 
                      background: isClosed ? '#cbd5e1' : 'linear-gradient(135deg, #0D3E26, #166534)', 
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, 
                      cursor: isClosed ? 'not-allowed' : 'pointer', transition: 'all 0.15s', flexShrink: 0 
                    }}
                    onMouseEnter={e => { if (!isClosed) e.currentTarget.style.background = 'linear-gradient(135deg, #166534, #15803d)'; }}
                    onMouseLeave={e => { if (!isClosed) e.currentTarget.style.background = 'linear-gradient(135deg, #0D3E26, #166534)'; }}>
                    <Plus size={12} /> Thêm vào lớp
                  </button>
                </div>
              )}

              {searchError && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff1f2', borderRadius: 10, border: '1px solid #fecdd3', fontSize: '0.78rem', color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} color="#f43f5e" />{searchError}
                </div>
              )}

              {availableStudents.length > 0 && !searchedStudent && !searchError && (
                <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  Gợi ý mã ID học viên chưa gán: {availableStudents.slice(0, 5).map(s => s.id).join(', ')}...
                </span>
              )}
            </div>

            {/* Search enrolled */}
            {currentStudents.length > 0 && (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" value={enrolledSearchTerm} onChange={e => setEnrolledSearchTerm(e.target.value)}
                  placeholder="Tìm sinh viên trong lớp theo Tên, Email hoặc ID..."
                  style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.8rem', color: '#0f172a', background: '#f8fafc', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            )}

            {/* Students list */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 240, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {loadingStudents ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <Loader2 size={22} color="#10b981" style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Đang tải danh sách sinh viên...</p>
                </div>
              ) : currentStudents.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <Users size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Chưa có học viên nào trong lớp.</p>
                </div>
              ) : filteredCurrentStudents.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <Users size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Không tìm thấy học viên nào phù hợp với tìm kiếm.</p>
                </div>
              ) : (
                filteredCurrentStudents.map(std => {
                  const avatarBg = getAvatarBg(std.id);
                  return (
                    <div key={std.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                          {getInitials(std.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {std.name} <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>[ID: {std.id}]</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{std.email}</div>
                        </div>
                      </div>
                      {!isClosed && (
                        <button onClick={() => handleRemove(std.id)} title="Xóa khỏi lớp" style={iconBtnStyle('#fee2e2', '#ef4444')}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fecaca'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
          {isClosed ? (
            <button onClick={onClose}
              style={{
                padding: '9px 24px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #0D3E26, #166534)',
                color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(13,62,38,0.2)', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #166534, #15803d)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #0D3E26, #166534)'; }}>
              Đóng
            </button>
          ) : (
            <>
              <button onClick={onClose} disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginRight: 10, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
                Hủy bỏ
              </button>
              <button onClick={handleSave} disabled={saving || loadingStudents}
                style={{
                  padding: '9px 24px', borderRadius: 12, border: 'none',
                  background: (saving || loadingStudents) ? '#94a3b8' : 'linear-gradient(135deg, #0D3E26, #166534)',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                  cursor: (saving || loadingStudents) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(13,62,38,0.2)', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => { if (!saving && !loadingStudents) e.currentTarget.style.background = 'linear-gradient(135deg, #166534, #15803d)'; }}
                onMouseLeave={e => { if (!saving && !loadingStudents) e.currentTarget.style.background = 'linear-gradient(135deg, #0D3E26, #166534)'; }}>
                {saving
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
                  : 'Lưu thay đổi'
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Roadmap Generator ─── */
const generateRoadmap = (courseCode, courseName) => {
  const code = String(courseCode || '').toUpperCase();
  const name = String(courseName || '');
  const isCSharp = code.includes('PRN') || code.includes('CS') || name.toLowerCase().includes('c#') || name.toLowerCase().includes('lập trình');
  const isSWP = code.includes('SWP') || code.includes('PROJ') || name.toLowerCase().includes('dự án') || name.toLowerCase().includes('đồ án');

  if (isCSharp) {
    return [
      { week: 'Tuần 1', title: 'Cài đặt môi trường & Cú pháp cơ bản .NET C#', status: 'COMPLETED', lessons: ['Khởi tạo dự án Console App trong Visual Studio', 'Biến, toán tử và các kiểu dữ liệu cơ bản', 'Cấu trúc điều kiện rẽ nhánh và vòng lặp'], note: 'Sinh viên cần cài đặt trước Visual Studio 2022 Community hoặc Rider.', resources: ['Slide bài học 1', 'Lab 1 - Cơ bản C#'] },
      { week: 'Tuần 2', title: 'Lập trình Hướng đối tượng (OOP) nâng cao', status: 'COMPLETED', lessons: ['Tính kế thừa, đóng gói, đa hình', 'Tính trừu tượng (Abstract class & Interface)', 'Xử lý ngoại lệ (Exception Handling)'], note: 'Trọng tâm bài học nằm ở phần áp dụng Đa hình trong thiết kế hệ thống.', resources: ['Slide bài học 2', 'Lab 2 - Quản lý nhân viên'] },
      { week: 'Tuần 3', title: 'Làm việc với Collections, LINQ & Generics', status: 'ACTIVE', lessons: ['Generic class & Generic method', 'Sử dụng List, Dictionary, HashSet', 'Truy vấn dữ liệu nâng cao với LINQ'], note: 'Tuần này có bài trắc nghiệm nhanh 10 phút đầu giờ học.', resources: ['Slide bài học 3', 'CheatSheet truy vấn LINQ'] },
      { week: 'Tuần 4', title: 'Tương tác Database với Entity Framework Core', status: 'UPCOMING', lessons: ['Cài đặt EF Core Packages & DbContext', 'Cấu hình Code-First / Db-First mappings', 'Thao tác CRUD với Database thực tế'], note: 'Cần có hệ quản trị CSDL SQL Server cài sẵn.', resources: ['Hướng dẫn cài đặt SQL Server', 'Slide EF Core'] },
      { week: 'Tuần 5', title: 'Xây dựng RESTful API với ASP.NET Core Web API', status: 'UPCOMING', lessons: ['Kiến trúc Controllers & API Routing', 'Dependency Injection trong ASP.NET Core', 'Model Validation & Trả về JSON chuẩn'], note: 'Đọc trước tài liệu kiến trúc REST API.', resources: ['API Design Guidelines', 'Slide Web API'] },
      { week: 'Tuần 6', title: 'Bảo mật Web API: Xác thực JWT & Phân quyền', status: 'UPCOMING', lessons: ['Cơ chế hoạt động của JSON Web Token', 'Tạo và giải mã JWT trong Backend', 'Phân quyền phân vai với [Authorize(Roles = "...")]'], note: 'Đây là bài học cực kỳ quan trọng cho dự án môn học.', resources: ['Tài liệu JWT Auth', 'Mẫu cấu hình bảo mật'] },
      { week: 'Tuần 7', title: 'Kiểm thử phần mềm & Triển khai ứng dụng', status: 'UPCOMING', lessons: ['Viết Unit Test với xUnit', 'Mock dependencies bằng Moq', 'Đóng gói và triển khai hosting'], note: 'Tuần cuối cùng - Ôn tập chuẩn bị thi thực hành cuối kỳ.', resources: ['Slide Testing', 'Đề cương ôn tập'] },
    ];
  }

  if (isSWP) {
    return [
      { week: 'Tuần 1', title: 'Thành lập nhóm & Định hình Ý tưởng Dự án', status: 'COMPLETED', lessons: ['Phân chia vai trò thành viên (WBS)', 'Phân tích tính khả thi và định hướng giải pháp', 'Lập tiến độ tổng quan (Gantt Chart)'], note: 'Nhóm trưởng nộp lại đề xuất đề tài trước thứ Sáu.', resources: ['Mẫu đề xuất đề tài', 'Bảng Gantt Chart mẫu'] },
      { week: 'Tuần 2', title: 'Phân tích Yêu cầu & Thiết kế Hệ thống', status: 'COMPLETED', lessons: ['Phân tích yêu cầu chức năng & phi chức năng', 'Vẽ sơ đồ Use Case và Sơ đồ hoạt động (Activity)', 'Thiết kế Mockup UI/UX ban đầu bằng Figma'], note: 'Cần đặc biệt chú ý đến luồng nghiệp vụ chính của hệ thống.', resources: ['Tài liệu SRS mẫu', 'Figma Wireframe Kit'] },
      { week: 'Tuần 3', title: 'Thiết kế Cấu trúc CSDL (ERD) & Khung dự án', status: 'ACTIVE', lessons: ['Vẽ sơ đồ ERD tối ưu hóa quan hệ', 'Khởi tạo GitHub repository chung của nhóm', 'Cấu trúc Skeleton dự án FrontEnd và BackEnd'], note: 'Cả nhóm phải thực hành commit code lên nhánh phát triển phụ.', resources: ['Slide Database Design', 'Git Workflow Guideline'] },
      { week: 'Tuần 4', title: 'Sprint 1: Xây dựng các tính năng Core & Auth', status: 'UPCOMING', lessons: ['Code giao diện Đăng nhập, Đăng ký', 'Xây dựng API đăng nhập & lưu trữ Token', 'Kết nối cơ sở dữ liệu thực tế'], note: 'Giảng viên sẽ đánh giá tiến độ Sprint 1 trực tiếp.', resources: ['Tiêu chí chấm Sprint 1', 'Mẫu báo cáo tuần'] },
      { week: 'Tuần 5', title: 'Sprint 2: Tính năng nghiệp vụ chính & Quản trị', status: 'UPCOMING', lessons: ['Phát triển giao diện Dashboard Admin', 'Code các luồng giao dịch nghiệp vụ cốt lõi', 'Xử lý phân quyền người dùng'], note: 'Kiểm soát chặt chẽ các lỗi rò rỉ dữ liệu hoặc phân quyền sai.', resources: ['Tài liệu kỹ thuật nghiệp vụ', 'Mẫu báo cáo Sprint 2'] },
      { week: 'Tuần 6', title: 'Sprint 3: Tích hợp hệ thống & Kiểm thử tổng thể', status: 'UPCOMING', lessons: ['Ghép nối giao diện API toàn diện', 'Thực hiện kiểm thử hộp đen (Black-box testing)', 'Sửa lỗi giao diện và vá lỗi logic bảo mật'], note: 'Tập trung cao độ sửa các lỗi nghiêm trọng (Critical bugs).', resources: ['Mẫu kịch bản kiểm thử (Test Case)', 'Bảng log lỗi nhóm'] },
      { week: 'Tuần 7', title: 'Hoàn thiện Sản phẩm, Triển khai & Demo bảo vệ', status: 'UPCOMING', lessons: ['Triển khai ứng dụng lên server cloud', 'Quay video demo sản phẩm hoạt động', 'Viết báo cáo tổng kết môn học (Final Report)'], note: 'Buổi bảo vệ thử trước giảng viên hướng dẫn.', resources: ['Slide mẫu bảo vệ', 'Tiêu chí đánh giá chung cuộc'] },
    ];
  }

  return [
    { week: 'Chặng 1', title: 'Làm quen & Khái niệm nền tảng cốt lõi', status: 'COMPLETED', lessons: ['Giới thiệu đề cương học phần', 'Lịch sử phát triển và các định nghĩa nền tảng', 'Các công cụ làm việc cơ bản'], note: 'Sinh viên tải đề cương môn học học phần.', resources: ['Đề cương học phần', 'Tài liệu giới thiệu'] },
    { week: 'Chặng 2', title: 'Nghiên cứu chuyên sâu lý thuyết chuyên ngành', status: 'ACTIVE', lessons: ['Các mô hình kiến trúc cốt lõi', 'Phân tích các nguyên lý làm việc', 'Nghiên cứu tài liệu tham khảo khoa học'], note: 'Sinh viên chuẩn bị bài thảo luận nhóm số 1.', resources: ['Bài đọc nghiên cứu 1', 'Slide chuyên đề 2'] },
    { week: 'Chặng 3', title: 'Thực hành ứng dụng & Giải quyết tình huống thực tế', status: 'UPCOMING', lessons: ['Giải quyết bài toán thực tế (Case study)', 'Thực hành viết báo cáo phân tích chuyên đề', 'Tối ưu hóa các giải pháp lựa chọn'], note: 'Nộp báo cáo chuyên đề thực tế qua hệ thống LMS.', resources: ['Đề bài chuyên đề case-study', 'Tiêu chuẩn chấm điểm'] },
    { week: 'Chặng 4', title: 'Đánh giá quá trình, Ôn tập & Thi cuối kỳ', status: 'UPCOMING', lessons: ['Trình bày kết quả nghiên cứu nhóm', 'Hỏi đáp phản biện cùng giảng viên', 'Đề cương hệ thống hóa kiến thức môn học'], note: 'Chúc các sinh viên ôn tập tốt và thi đạt kết quả cao!', resources: ['Đề cương ôn thi cuối khóa'] },
  ];
};

/* ─── ClassRoadmapModal ─────────────────────────────────── */
function ClassRoadmapModal({ isOpen, cls, onClose }) {
  if (!isOpen || !cls) return null;
  const roadmapData = generateRoadmap(cls.courseCode, cls.courseName);
  const completedCount = roadmapData.filter(r => r.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / roadmapData.length) * 100);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return { label: 'Đã hoàn thành', bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' };
      case 'ACTIVE': return { label: 'Đang giảng dạy', bg: '#fffbeb', color: '#d97706', border: '#fcd34d' };
      default: return { label: 'Chờ học', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'clsFadeIn 0.18s ease' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2rem', width: '100%', maxWidth: 740, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', animation: 'clsSlideUp 0.22s ease', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Milestone size={22} color="#0D3E26" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0D3E26' }}>Lộ trình dạy & học: {cls.courseName || 'Môn học'}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Lớp: <span style={{ fontWeight: 700, color: '#0D3E26' }}>{cls.code}</span> | Giảng viên: <span style={{ fontWeight: 700, color: '#0D3E26' }}>{cls.lecturer || 'Chưa phân công'}</span></p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...iconBtnStyle('#f1f5f9', '#64748b'), width: 32, height: 32 }}><X size={18} /></button>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Tiến độ giảng dạy</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0D3E26' }}>{completedCount} / {roadmapData.length} phần ({progressPercent}%)</span>
            </div>
            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #0D3E26, #10b981)', borderRadius: 999, transition: 'width 0.4s ease' }} />
            </div>
          </div>
          <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Lộ trình học tập chuẩn</div>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20, paddingLeft: 20, borderLeft: '2.5px dashed #cbd5e1', marginLeft: 10, marginBottom: 10 }}>
          {roadmapData.map((item, idx) => {
            const statusStyle = getStatusStyle(item.status);
            const isCompleted = item.status === 'COMPLETED';
            const isActive = item.status === 'ACTIVE';
            return (
              <div key={idx} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -27.5, top: 4, width: 13, height: 13, borderRadius: '50%', background: isCompleted ? '#10b981' : (isActive ? '#f59e0b' : '#94a3b8'), border: `3px solid ${isCompleted ? '#ecfdf5' : (isActive ? '#fffbeb' : '#fff')}`, boxShadow: isActive ? '0 0 0 4px rgba(245,158,11,0.2)' : 'none', animation: isActive ? 'clsPulse 2s infinite' : 'none', zIndex: 2 }} />
                <div style={{ background: isActive ? '#fffbeb' : '#ffffff', border: `1.5px solid ${isActive ? '#fcd34d' : '#e2e8f0'}`, borderRadius: 18, padding: 16, boxShadow: isActive ? '0 4px 20px rgba(217,119,6,0.06)' : '0 1px 4px rgba(0,0,0,0.02)', transition: 'transform 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isCompleted ? '#065f46' : '#64748b', background: isCompleted ? '#d1fae5' : '#f1f5f9', padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.week}</span>
                      <h4 style={{ margin: '6px 0 0', fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>{item.title}</h4>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>{statusStyle.label}</span>
                  </div>
                  <div style={{ background: isActive ? 'rgba(255,255,255,0.7)' : '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Nội dung bài học:</span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {item.lessons.map((lesson, lIdx) => <li key={lIdx}>{lesson}</li>)}
                    </ul>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    {item.note && <div><strong style={{ color: '#0D3E26' }}>Ghi chú giảng dạy: </strong><span style={{ color: '#64748b', fontStyle: 'italic' }}>{item.note}</span></div>}
                    {item.resources && item.resources.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#475569' }}>Tài liệu đính kèm:</strong>
                        {item.resources.map((res, rIdx) => (
                          <span key={rIdx} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => alert(`Tải xuống tài liệu: "${res}"`)} title="Nhấp để tải xuống tài liệu">📄 {res}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000001, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: isError ? '#fff1f2' : '#ecfdf5', border: `1px solid ${isError ? '#fecdd3' : '#a7f3d0'}`, borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', animation: 'clsSlideUp 0.25s ease' }}>
      {isError ? <AlertCircle size={17} color="#f43f5e" /> : <CheckCircle size={17} color="#10b981" />}
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isError ? '#be123c' : '#065f46' }}>{toast.message}</span>
    </div>
  );
}

/* ─── ClassModal ─────────────────────────────────── */
function ClassModal({ isOpen, editingClass, classForm, setClassForm, onSave, onClose, courses = [], lecturers = [], termEndDate = '' }) {
  if (!isOpen) return null;
  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.875rem', color: '#0f172a', background: '#f8fafc', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' };
  const readonlyStyle = { ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'default', border: '1.5px solid #e2e8f0' };
  const onFocus = (e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; e.target.style.background = '#fff'; };
  const onBlur = (e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; };

  const statusLabel = { ACTIVE: '🟢 Đang mở', UPCOMING: '🟡 Sắp khai giảng', CLOSED: '⚪ Đã đóng' };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'clsFadeIn 0.15s ease' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', animation: 'clsSlideUp 0.2s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{editingClass ? 'Cập nhật thông tin lớp học' : 'Điền đầy đủ thông tin bên dưới'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ ...iconBtnStyle('#f1f5f9', '#64748b'), width: 32, height: 32 }}><X size={16} /></button>
        </div>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mã lớp + Môn học */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Mã lớp <span style={{ color: '#f43f5e' }}>*</span></label>
              <input value={classForm.code} onChange={e => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                style={{ ...inputStyle, fontWeight: 700, letterSpacing: '0.06em' }} placeholder="SE1908" required onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Môn học <span style={{ color: '#f43f5e' }}>*</span></label>
              <select value={classForm.courseId || ''} onChange={e => {
                const selected = courses.find(c => c.id === e.target.value);
                setClassForm({ ...classForm, courseId: e.target.value, courseCode: selected ? selected.code : '', courseName: selected ? selected.name : '' });
              }} style={{ ...inputStyle, cursor: 'pointer' }} required onFocus={onFocus} onBlur={onBlur}>
                <option value="" disabled>-- Chọn môn học --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Giảng viên — chọn trực tiếp từ danh sách active lecturers */}
          <div>
            <label style={labelStyle}>
              Giảng viên phụ trách
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94a3b8', marginLeft: 6 }}>(có thể gán sau)</span>
            </label>
            <select
              value={classForm.lecturerId || ''}
              onChange={e => {
                const val = e.target.value;
                const selected = lecturers.find(l => String(l.id) === val);
                setClassForm({
                  ...classForm,
                  lecturerId: val || null,
                  lecturer: selected ? selected.name : ''
                });
              }}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="">-- Chưa phân công --</option>
              {lecturers.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
              ))}
            </select>
          </div>

          {/* Ngày khai giảng — read-only theo học kỳ | Ngày kết thúc — có thể sớm hơn học kỳ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>
                Ngày khai giảng
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94a3b8', marginLeft: 6 }}>(cố định)</span>
              </label>
              <input type="date" value={classForm.startDate} readOnly
                style={readonlyStyle} title="Lấy từ ngày bắt đầu học kỳ" />
            </div>
            <div>
              <label style={labelStyle}>
                Ngày kết thúc
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#f59e0b', marginLeft: 6 }}></span>
              </label>
              <input
                type="date"
                value={classForm.endDate}
                min={classForm.startDate || undefined}
                max={termEndDate || undefined}
                onChange={e => {
                  const newEnd = e.target.value;
                  // Tự cập nhật trạng thái khi ngày kết thúc thay đổi
                  const now = new Date();
                  const start = classForm.startDate ? new Date(classForm.startDate) : null;
                  const end = newEnd ? new Date(newEnd) : null;
                  let newStatus = classForm.status;
                  if (start && end) {
                    if (now < start) newStatus = 'UPCOMING';
                    else if (now > end) newStatus = 'CLOSED';
                    else newStatus = 'ACTIVE';
                  }
                  setClassForm({ ...classForm, endDate: newEnd, status: newStatus });
                }}
                style={{ ...inputStyle, borderColor: '#fcd34d' }}
                onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#fcd34d'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
              />
              {termEndDate && classForm.endDate && classForm.endDate < termEndDate && (
                <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 500, display: 'block', marginTop: 4 }}>
                  Lớp kết thúc sớm hơn học kỳ ({termEndDate})
                </span>
              )}
            </div>
          </div>

          {/* Trạng thái — tự động theo ngày */}
          <div>
            <label style={labelStyle}>
              Trạng thái
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#10b981', marginLeft: 6 }}>(tự động)</span>
            </label>
            <input readOnly value={statusLabel[classForm.status] || classForm.status}
              style={readonlyStyle} title="Trạng thái tự tính theo ngày" />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Hủy bỏ</button>
            <button type="submit" style={primaryBtnStyle}>{editingClass ? 'Lưu thay đổi' : 'Tạo lớp học'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── MAIN: ClassesDashboard (API-integrated) ─────────── */
function ClassesDashboard({ terms = [], selectedTerm, onTermChange, users = [], toast, showToast }) {
  const term = selectedTerm;
  const lecturers = useMemo(() => users.filter(u => u.role === 'Lecturer' && u.status === 'ACTIVE'), [users]);

  /* ── Courses ── */
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    fetchCourses()
      .then(res => {
        let list = [];
        if (res && res.success && Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res)) list = res;
        else if (res && Array.isArray(res.data)) list = res.data;
        setCourses(list);
      })
      .catch(err => console.error('Error loading courses for classes:', err));
  }, []);

  /* ── Year/Term grouping ── */
  const getTermYear = (t) => {
    if (!t || !t.startDate) return 'Khác';
    return t.startDate.substring(0, 4);
  };

  const groupedTerms = useMemo(() => {
    const map = {};
    terms.forEach(t => {
      const y = getTermYear(t);
      if (!map[y]) map[y] = [];
      map[y].push(t);
    });
    return map;
  }, [terms]);

  const yearsList = useMemo(() => Object.keys(groupedTerms).sort((a, b) => Number(b) - Number(a)), [groupedTerms]);

  const [activeYear, setActiveYear] = useState('');

  useEffect(() => {
    if (selectedTerm) setActiveYear(getTermYear(selectedTerm));
  }, [selectedTerm]);

  // Tự động chọn học kỳ ACTIVE (hoặc đầu tiên) nếu chưa có selectedTerm
  useEffect(() => {
    if (!selectedTerm && terms.length > 0 && onTermChange) {
      const active = terms.find(t => t.status === 'ACTIVE') || terms[0];
      if (active) {
        onTermChange(active);
        setActiveYear(getTermYear(active));
      }
    }
  }, [selectedTerm, terms, onTermChange]);

  useEffect(() => {
    if (!selectedTerm && yearsList.length > 0 && !activeYear) setActiveYear(yearsList[0]);
  }, [selectedTerm, yearsList, activeYear]);

  /* ── Classes from API ── */
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const loadClasses = useCallback(async (termId, silent = false) => {
    if (!termId) { setClasses([]); return; }
    if (!silent) setLoadingClasses(true);
    try {
      const res = await getClasses(termId);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.data)) list = res.data;
      else if (res && res.$values && Array.isArray(res.$values)) list = res.$values;
      else if (res && typeof res === 'object') {
        const found = Object.values(res).find(v => Array.isArray(v));
        if (found) list = found;
      }
      const normalized = list.map(normalizeClass);
      const filtered = normalized.filter(c => String(c.termId) === String(termId));
      setClasses(filtered);
    } catch (err) {
      console.error('Error loading classes:', err);
      showToast('Không thể tải danh sách lớp học!', 'error');
    } finally {
      if (!silent) setLoadingClasses(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClasses(term?.id);
  }, [term?.id, loadClasses]);

  /* ── UI state ── */
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({
    code: '', courseId: '', courseCode: '', courseName: '', lecturer: '', lecturerId: null,
    startDate: '', endDate: '', maxStudents: 30, room: '', status: 'ACTIVE',
  });
  const [detailedClass, setDetailedClass] = useState(null);
  const [roadmapClass, setRoadmapClass] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    setSearch('');
    setFilterStatus('ALL');
  }, [term?.id]);

  /* ── Handlers ── */

  /** Called by ClassDetailModal after APIs succeed */
  const handleSaveDetails = useCallback(async (_classId, _lecturerName, _studentsList) => {
    // Reload classes list to reflect latest data from server silently to prevent flashing
    await loadClasses(term?.id, true);
    showToast('Đã lưu thông tin phân lớp thành công!');
  }, [loadClasses, term?.id, showToast]);

  const filtered = useMemo(() => classes.filter(c => {
    const matchSearch = !search ||
      c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.lecturer?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchStatus;
  }), [classes, search, filterStatus]);

  const handleOpen = (cls = null) => {
    if (cls) {
      if (cls.status === 'CLOSED') {
        showToast('Lớp học này đã kết thúc, không thể thực hiện chỉnh sửa!', 'error');
        return;
      }
      setEditingClass(cls);
      setClassForm({
        code: cls.code || '', courseId: cls.courseId || '', courseCode: cls.courseCode || '',
        courseName: cls.courseName || '', lecturer: cls.lecturer || '', lecturerId: cls.lecturerId || null,
        startDate: cls.startDate || '', endDate: cls.endDate || '',
        maxStudents: cls.maxStudents || 30, room: cls.room || '', status: cls.status,
      });
    } else {
      // Chặn tạo lớp học nếu học kỳ đã kết thúc
      if (term?.status === 'COMPLETED') {
        showToast('Học kỳ này đã kết thúc, không thể tạo thêm lớp học mới!', 'error');
        return;
      }
      // Tính trạng thái tự động dựa theo ngày của học kỳ
      const now = new Date();
      const tStart = term?.startDate ? new Date(term.startDate) : null;
      const tEnd = term?.endDate ? new Date(term.endDate) : null;
      let autoStatus = 'ACTIVE';
      if (tStart && tEnd) {
        if (now < tStart) autoStatus = 'UPCOMING';
        else if (now > tEnd) autoStatus = 'CLOSED';
        else autoStatus = 'ACTIVE';
      }
      setEditingClass(null);
      setClassForm({
        code: '', courseId: '', courseCode: '', courseName: '', lecturer: '', lecturerId: null,
        startDate: (term?.startDate || '').substring(0, 10),
        endDate: (term?.endDate || '').substring(0, 10),
        maxStudents: 30, room: '', status: autoStatus,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { code, courseId, startDate, endDate } = classForm;
    if (!code.trim() || !courseId) { showToast('Vui lòng chọn môn học và nhập mã lớp!', 'error'); return; }
    if (!term?.id) { showToast('Vui lòng chọn học kỳ trước khi tạo lớp học!', 'error'); return; }
    if (term?.status === 'COMPLETED') {
      showToast('Học kỳ này đã kết thúc, không thể thực hiện tạo hoặc chỉnh sửa lớp!', 'error');
      return;
    }
    if (editingClass && editingClass.status === 'CLOSED') {
      showToast('Lớp học này đã kết thúc, không thể cập nhật thông tin!', 'error');
      return;
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      showToast('Ngày khai giảng phải trước ngày kết thúc!', 'error'); return;
    }
    try {
      if (editingClass) {
        // Update: chỉ gửi các field backend chấp nhận
        const updatePayload = {
          id: classForm.code.trim().toUpperCase(),  // backend dùng Id = mã lớp
          courseId: classForm.courseId,
          academicTermId: term?.id,
          lecturerId: classForm.lecturerId || null,
          allowReviewAfterEnd: false,
          startDate: classForm.startDate || null,
          endDate: classForm.endDate || null,
        };
        console.log('[ClassesDashboard] updateClass payload:', updatePayload);
        await updateClassApi(editingClass.id, updatePayload);
        showToast('Đã cập nhật lớp học thành công!');
      } else {
        const trimmedCode = code.trim().toUpperCase();
        if (classes.some(c => c.code?.toUpperCase() === trimmedCode)) {
          showToast(`Mã lớp "${trimmedCode}" đã tồn tại!`, 'error'); return;
        }
        // Create: Id = mã lớp, lecturerId có thể được gán hoặc null
        const createPayload = {
          id: trimmedCode,              // backend field: Id = mã lớp
          courseId: classForm.courseId,
          academicTermId: term?.id,
          lecturerId: classForm.lecturerId || null,
          allowReviewAfterEnd: false,
          startDate: classForm.startDate || null,
          endDate: classForm.endDate || null,
        };
        console.log('[ClassesDashboard] createClass payload:', createPayload);
        await createClassApi(createPayload);
        showToast('Đã thêm lớp học thành công!');
      }
      setIsModalOpen(false);
      await loadClasses(term?.id);
    } catch (err) {
      console.error('[ClassesDashboard] handleSave error:', err);
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteClassApi(itemToDelete.id);
      showToast(`Đã xóa lớp "${itemToDelete.name}" thành công!`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await loadClasses(term?.id);
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes clsSlideUp {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes clsFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes clsPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.3); }
          50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0.1); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes confirmFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes confirmScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ background: 'linear-gradient(135deg, #0D3E26 0%, #065f46 60%, #064e3b 100%)', borderRadius: 20, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 4px 20px rgba(13,62,38,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
              <BookOpen size={22} color="#34d399" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>Quản lý Lớp học</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{term ? `Đang xem: ${term.name}` : 'Chọn học kỳ để xem danh sách lớp học'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {term && term.status !== 'COMPLETED' && (
              <button onClick={() => handleOpen()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
                <Plus size={16} />Thêm lớp học
              </button>
            )}
          </div>
        </div>

        {/* ── Year & Term Selector ── */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="#10b981" />
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Học kỳ theo năm học</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>Lọc danh sách các học kỳ theo từng năm</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={activeYear} onChange={e => setActiveYear(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0D3E26', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', outline: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0D3E26'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                {yearsList.map(y => <option key={y} value={y}>📅 Năm {y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {activeYear && groupedTerms[activeYear] && groupedTerms[activeYear].length > 0 ? (
              groupedTerms[activeYear].map(termItem => {
                const isActive = selectedTerm?.id === termItem.id;
                const statusCfg = TERM_STATUS_MAP[termItem.status] || TERM_STATUS_MAP.COMPLETED;
                return (
                  <div key={termItem.id} onClick={() => onTermChange(termItem)}
                    style={{ background: isActive ? '#ecfdf5' : '#ffffff', border: '2px solid', borderColor: isActive ? '#0D3E26' : '#e2e8f0', borderRadius: 18, padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: isActive ? '0 4px 15px rgba(13,62,38,0.08)' : '0 1px 4px rgba(0,0,0,0.02)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (!isActive) { e.currentTarget.style.borderColor = '#0D3E26'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(13,62,38,0.06)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (!isActive) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)'; } }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: isActive ? 'linear-gradient(to bottom, #0D3E26, #10b981)' : 'transparent' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {termItem.code && <span style={{ fontSize: 10, fontWeight: 800, color: '#0D3E26', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.03em' }}>{termItem.code}</span>}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: statusCfg.color }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot }} />{statusCfg.label}
                        </span>
                      </div>
                      {isActive && <CheckCircle size={16} color="#0D3E26" />}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isActive ? '#0D3E26' : '#1e293b', lineHeight: 1.4 }}>{termItem.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      <CalendarDays size={12} color="#94a3b8" />
                      <span>{formatDate(termItem.startDate)} - {formatDate(termItem.endDate)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Không có học kỳ nào cho năm này</div>
            )}
          </div>
        </div>

        {/* ── No term selected ── */}
        {!term && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: 20, border: '1px dashed #c7d2fe' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Calendar size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Chọn học kỳ để bắt đầu</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, maxWidth: 340 }}>Nhấp chọn học kỳ từ danh sách năm học phía trên để xem danh sách lớp học tương ứng.</p>
          </div>
        )}

        {/* ── Classes content ── */}
        {term && (
          <>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên lớp, mã lớp, giảng viên..."
                  style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.875rem', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
              </div>
              {['ALL', 'ACTIVE', 'UPCOMING', 'CLOSED'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid', borderColor: filterStatus === s ? '#0D3E26' : '#e2e8f0', background: filterStatus === s ? '#ecfdf5' : '#fff', color: filterStatus === s ? '#0D3E26' : '#64748b', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {s === 'ALL' ? 'Tất cả' : CLASS_STATUS_MAP[s]?.label || s}
                </button>
              ))}
            </div>

            {/* Loading state */}
            {loadingClasses ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
                <Loader2 size={32} color="#10b981" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>Đang tải danh sách lớp học...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <BookOpen size={30} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Chưa có lớp học nào</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px', maxWidth: 300 }}>
                  {term.status === 'COMPLETED' ? 'Học kỳ này đã kết thúc. Không thể tạo thêm lớp học mới.' : 'Thêm lớp học đầu tiên cho học kỳ này để bắt đầu tổ chức giảng dạy.'}
                </p>
                {term.status !== 'COMPLETED' && (
                  <button onClick={() => handleOpen()} style={primaryBtnStyle}><Plus size={15} /> Thêm lớp học</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                {filtered.map(cls => (
                  <ClassCard key={cls.id} cls={cls} onEdit={handleOpen} onDelete={handleDelete}
                    onViewDetails={(c) => setDetailedClass(c)} onViewRoadmap={(c) => setRoadmapClass(c)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ClassModal isOpen={isModalOpen} editingClass={editingClass} classForm={classForm} setClassForm={setClassForm} onSave={handleSave} onClose={() => setIsModalOpen(false)} courses={courses} lecturers={lecturers} termEndDate={(term?.endDate || '').substring(0, 10)} />

      <ClassDetailModal isOpen={Boolean(detailedClass)} cls={detailedClass} users={users} onSaveDetails={handleSaveDetails} onClose={() => setDetailedClass(null)} />

      <ClassRoadmapModal isOpen={Boolean(roadmapClass)} cls={roadmapClass} onClose={() => setRoadmapClass(null)} />
      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${itemToDelete?.name || ''}"? Hành động này không thể hoàn tác.`}
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

export default ClassesDashboard;
