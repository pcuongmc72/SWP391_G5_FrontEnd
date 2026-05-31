import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, CheckCircle, Trash2, Edit2, X,
  Search, Clock, ChevronRight, BookOpen, AlertCircle,
  CalendarDays, Layers, Loader2,
} from 'lucide-react';
import {
  fetchAcademicTerms,
  createAcademicTerm,
  updateAcademicTerm,
  deleteAcademicTerm,
} from '../../services/academicTermService';
import { getClasses } from '../../services/classService';

/* ─── Helpers ──────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE: { label: 'Đang diễn ra', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981' },
  UPCOMING: { label: 'Sắp tới', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
  COMPLETED: { label: 'Đã kết thúc', color: '#94a3b8', bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' },
};

/**
 * Tính status dựa theo ngày hiện tại so với startDate / endDate
 */
function computeStatus(startDate, endDate) {
  if (!startDate || !endDate) return 'COMPLETED';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const start = new Date(startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();

  const end = new Date(endDate);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  if (today < startDay) return 'UPCOMING';
  if (today > endDay) return 'COMPLETED';
  return 'ACTIVE';
}

/**
 * Map dữ liệu trả về từ API sang shape mà UI cần.
 * API trả về: { id, termCode, name, startDate, endDate }
 */
function mapApiTerm(t) {
  if (!t) return null;
  const id = t.id ?? t.Id ?? '';
  const code = t.termCode ?? t.TermCode ?? '';
  const name = t.name ?? t.Name ?? '';
  const startDate = t.startDate ? t.startDate.substring(0, 10) : (t.StartDate ? t.StartDate.substring(0, 10) : '');
  const endDate = t.endDate ? t.endDate.substring(0, 10) : (t.EndDate ? t.EndDate.substring(0, 10) : '');
  return {
    id,
    code,
    name,
    startDate,
    endDate,
    status: computeStatus(startDate, endDate),
  };
}

function getProgress(startDate, endDate) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function daysLeft(endDate) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ─── Sub-components ────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.COMPLETED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot,
        boxShadow: status === 'ACTIVE' ? `0 0 0 3px ${cfg.border}` : 'none',
        animation: status === 'ACTIVE' ? 'pulse 2s infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, status }) {
  const color = STATUS_MAP[status]?.dot || '#94a3b8';
  return (
    <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${value}%`,
        background: status === 'ACTIVE'
          ? `linear-gradient(90deg, ${color}, #34d399)`
          : color,
        borderRadius: 999,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function TermCard({ term, onEdit, onDelete, onViewClasses }) {
  const progress = getProgress(term.startDate, term.endDate);
  const remaining = daysLeft(term.endDate);
  const cfg = STATUS_MAP[term.status] || STATUS_MAP.COMPLETED;

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
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(13,62,38,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Decorative top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: term.status === 'ACTIVE'
          ? 'linear-gradient(90deg, #0D3E26, #10b981)'
          : term.status === 'UPCOMING'
            ? 'linear-gradient(90deg, #f59e0b, #fcd34d)'
            : '#e2e8f0',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <StatusBadge status={term.status} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(term)}
            title="Chỉnh sửa"
            style={iconBtnStyle('#f8fafc', '#64748b')}>
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(term.id, term.name)}
            title="Xóa"
            style={iconBtnStyle('#fff1f2', '#f43f5e')}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Code chip */}
      {term.code && (
        <span style={{
          display: 'inline-block', fontSize: 10, fontWeight: 800,
          color: '#0D3E26', background: '#ecfdf5',
          border: '1px solid #a7f3d0', borderRadius: 6,
          padding: '2px 7px', letterSpacing: '0.06em',
          marginBottom: 6, alignSelf: 'flex-start',
        }}>
          {term.code}
        </span>
      )}

      {/* Name */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
        {term.name}
      </h3>

      {/* Dates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
        <DateRow icon={<CalendarDays size={13} color="#10b981" />} label="Khai giảng" value={formatDate(term.startDate)} />
        <DateRow icon={<CalendarDays size={13} color="#f59e0b" />} label="Bế giảng" value={formatDate(term.endDate)} />
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Tiến độ</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{progress}%</span>
        </div>
        <ProgressBar value={progress} status={term.status} />
      </div>

      {/* Days remaining */}
      {remaining !== null && term.status !== 'COMPLETED' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
          <Clock size={12} color="#94a3b8" />
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Còn <strong style={{ color: '#0f172a' }}>{remaining} ngày</strong>
          </span>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 'auto', paddingTop: 12, marginBottom: 0 }}>
        <button
          onClick={() => onViewClasses(term)}
          style={{
            width: '100%', padding: '9px 12px',
            background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
            color: '#4338ca',
            border: '1px solid #c7d2fe',
            borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #e0e7ff, #c7d2fe)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #eef2ff, #e0e7ff)'; }}
        >
          <ChevronRight size={13} />
          Xem danh sách lớp học
        </button>
      </div>
    </div>
  );
}

function DateRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {icon}
      <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 70 }}>{label}:</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{value}</span>
    </div>
  );
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
        <Layers size={30} color="#10b981" />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
        Chưa có học kỳ nào
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px', maxWidth: 300 }}>
        Tạo học kỳ đầu tiên để bắt đầu tổ chức các lớp học và thành viên của bạn.
      </p>
      <button onClick={onAdd} style={primaryBtnStyle}>
        <Plus size={15} />
        Tạo học kỳ đầu tiên
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
      animation: 'slideUp 0.25s ease',
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
function TermModal({ isOpen, editingTerm, termForm, setTermForm, onSave, onClose, saving }) {
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
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 24, padding: '2rem',
        width: '100%', maxWidth: 460,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingTerm ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {editingTerm ? 'Cập nhật thông tin học kỳ' : 'Điền đầy đủ thông tin bên dưới'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ ...iconBtnStyle('#f1f5f9', '#64748b'), width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Mã học kỳ <span style={{ color: '#f43f5e' }}>*</span></label>
            <input
              value={termForm.code}
              onChange={e => setTermForm({ ...termForm, code: e.target.value })}
              style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}
              placeholder="SP26"
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Tên học kỳ <span style={{ color: '#f43f5e' }}>*</span></label>
            <input
              value={termForm.name}
              onChange={e => setTermForm({ ...termForm, name: e.target.value })}
              style={inputStyle}
              placeholder="VD: Học kỳ 1 - Năm học 2025-2026"
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ngày khai giảng <span style={{ color: '#f43f5e' }}>*</span></label>
              <input
                type="date"
                value={termForm.startDate}
                onChange={e => setTermForm({ ...termForm, startDate: e.target.value })}
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ngày bế giảng <span style={{ color: '#f43f5e' }}>*</span></label>
              <input
                type="date"
                value={termForm.endDate}
                onChange={e => setTermForm({ ...termForm, endDate: e.target.value })}
                style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
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
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
                : <span>{editingTerm ? 'Lưu thay đổi' : 'Tạo học kỳ'}</span>
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
function TermsDashboard({ onViewClasses, onTermsChange, showToast, toast }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termForm, setTermForm] = useState({ code: '', name: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch dữ liệu từ API ── */
  const loadTerms = useCallback(async () => {
    try {
      setLoading(true);
      setApiError('');
      const responseData = await fetchAcademicTerms();

      let termList = [];
      if (Array.isArray(responseData)) {
        termList = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        termList = responseData.data;
      } else if (responseData && Array.isArray(responseData.items)) {
        termList = responseData.items;
      } else if (responseData && responseData.$values && Array.isArray(responseData.$values)) {
        termList = responseData.$values;
      } else if (responseData && typeof responseData === 'object') {
        const foundArray = Object.values(responseData).find(val => Array.isArray(val));
        if (foundArray) termList = foundArray;
      }

      const mapped = termList.map(mapApiTerm).filter(Boolean);
      setTerms(mapped);
      // Thông báo cho component cha nếu cần
      if (onTermsChange) onTermsChange(mapped);
    } catch (err) {
      setApiError(err.message || 'Không thể tải danh sách học kỳ.');
    } finally {
      setLoading(false);
    }
  }, [onTermsChange]);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const availableYears = useMemo(() => {
    const years = new Set();
    terms.forEach(t => {
      if (t.startDate) {
        years.add(new Date(t.startDate).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [terms]);


  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    return terms.filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      const termYear = t.startDate ? new Date(t.startDate).getFullYear().toString() : 'Khác';
      const matchYear = filterYear === 'ALL' || termYear === filterYear;
      return matchSearch && matchStatus && matchYear;
    });
  }, [terms, search, filterStatus, filterYear]);

  /* ── Open modal ── */
  const handleOpen = (term = null) => {
    if (term) {
      setEditingTerm(term);
      setTermForm({ code: term.code || '', name: term.name, startDate: term.startDate, endDate: term.endDate });
    } else {
      setEditingTerm(null);
      setTermForm({ code: '', name: '', startDate: '', endDate: '' });
    }
    setIsModalOpen(true);
  };

  /* ── Save (Create / Update) ── */
  const handleSave = async (e) => {
    e.preventDefault();
    const { code, name, startDate, endDate } = termForm;
    if (!code.trim()) {
      showToast('Vui lòng điền mã định danh học kỳ!', 'error'); return;
    }
    if (!name.trim()) {
      showToast('Vui lòng điền tên học kỳ!', 'error'); return;
    }
    if (!startDate) {
      showToast('Vui lòng chọn ngày khai giảng!', 'error'); return;
    }
    if (!endDate) {
      showToast('Vui lòng chọn ngày bế giảng!', 'error'); return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      showToast('Ngày khai giảng phải trước ngày bế giảng!', 'error'); return;
    }

    try {
      setSaving(true);
      const payload = {
        termCode: code.trim().toUpperCase(),
        name: name.trim(),
        startDate,
        endDate,
      };

      if (editingTerm) {
        // Kiểm tra xem thời gian mới có hợp lệ với các lớp học hiện có trong kỳ hay không
        try {
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

          const termClasses = allClasses.filter(c => {
            const cTermId = c.academicTermId ?? c.AcademicTermId ?? c.termId ?? c.TermId ?? '';
            return String(cTermId) === String(editingTerm.id);
          });

          const invalidClasses = termClasses.filter(c => {
            const cStart = c.startDate ?? c.StartDate ?? '';
            const cEnd = c.endDate ?? c.EndDate ?? '';
            if (!cStart && !cEnd) return false;

            const clsStart = cStart ? new Date(cStart.substring(0, 10)) : null;
            const clsEnd = cEnd ? new Date(cEnd.substring(0, 10)) : null;

            const newTermStart = new Date(startDate);
            const newTermEnd = new Date(endDate);

            return (clsStart && clsStart < newTermStart) || (clsEnd && clsEnd > newTermEnd);
          });

          if (invalidClasses.length > 0) {
            const classListText = invalidClasses.map(c => c.code ?? c.Code ?? c.id).join(', ');
            showToast(`Không thể cập nhật! Lớp học [${classListText}] có thời gian vượt ra ngoài phạm vi học kỳ mới.`, 'error');
            setSaving(false);
            return;
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra các lớp học:', err);
        }

        await updateAcademicTerm(editingTerm.id, payload);
        showToast(`Đã cập nhật "${name}" thành công!`);
      } else {
        await createAcademicTerm(payload);
        showToast(`Đã thêm học kỳ "${name}" thành công!`);
      }

      setIsModalOpen(false);
      await loadTerms(); // Reload danh sách từ API
    } catch (err) {
      showToast(err.message || 'Lưu thất bại, vui lòng thử lại!', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id, name) => {
    try {
      // Fetch all classes to check if this term has any classes
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

      // Check if any class belongs to this term
      const hasClasses = allClasses.some(c => {
        const cTermId = c.academicTermId ?? c.AcademicTermId ?? c.termId ?? c.TermId ?? '';
        return String(cTermId) === String(id);
      });

      if (hasClasses) {
        showToast(`Không thể xóa học kỳ "${name}" vì đang có lớp học thuộc học kỳ này!`, 'error');
        return;
      }

      // If no classes, open confirm modal
      setItemToDelete({ id, name });
      setDeleteConfirmOpen(true);
    } catch (err) {
      console.error('Lỗi khi kiểm tra lớp học thuộc học kỳ:', err);
      // Fallback: Open confirm modal anyway if API check fails
      setItemToDelete({ id, name });
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteAcademicTerm(itemToDelete.id);
      showToast(`Đã xóa "${itemToDelete.name}" thành công!`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await loadTerms();
    } catch (err) {
      showToast(err.message || 'Xóa thất bại, vui lòng thử lại!', 'error');
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
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.3); }
          50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0.1); }
        }
        @keyframes spin {
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
              <Calendar size={22} color="#34d399" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Quản lý Học kỳ
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                Tổ chức và theo dõi các kỳ học trong hệ thống đào tạo
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
            Thêm học kỳ mới
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
              onClick={loadTerms}
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
            <Loader2 size={22} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
            Đang tải danh sách học kỳ...
          </div>
        )}

        {/* ── Toolbar: search + filter ── */}
        {!loading && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm học kỳ..."
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  border: '1.5px solid #e2e8f0', borderRadius: 12,
                  fontSize: '0.875rem', background: '#fff', outline: 'none',
                  boxSizing: 'border-box', color: '#0f172a',
                }}
              />
            </div>

            {/* Year filter */}
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              style={{
                padding: '9px 14px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#0D3E26', fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer', outline: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0D3E26'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <option value="ALL">📅 Tất cả các năm</option>
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>

            {/* Filter chips */}
            {['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '8px 14px', borderRadius: 10,
                border: '1.5px solid',
                borderColor: filterStatus === s ? '#10b981' : '#e2e8f0',
                background: filterStatus === s ? '#ecfdf5' : '#fff',
                color: filterStatus === s ? '#065f46' : '#64748b',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {s === 'ALL' ? 'Tất cả' : STATUS_MAP[s]?.label || s}
              </button>
            ))}
          </div>
        )}

        {/* ── Cards grid ── */}
        {!loading && (
          filtered.length === 0 ? (
            <EmptyState onAdd={() => handleOpen()} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(term => (
                <TermCard
                  key={term.id}
                  term={term}
                  onEdit={handleOpen}
                  onDelete={handleDelete}
                  onViewClasses={onViewClasses || (() => { })}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Modal ── */}
      <TermModal
        isOpen={isModalOpen}
        editingTerm={editingTerm}
        termForm={termForm}
        setTermForm={setTermForm}
        onSave={handleSave}
        onClose={() => { if (!saving) setIsModalOpen(false); }}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        title="Xóa học kỳ"
        message={`Bạn có chắc chắn muốn xóa học kỳ "${itemToDelete?.name || ''}"? Hành động này không thể hoàn tác.`}
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

export default TermsDashboard;
