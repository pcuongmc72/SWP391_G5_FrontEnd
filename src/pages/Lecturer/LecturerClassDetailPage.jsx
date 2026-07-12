import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  createSession,
  getClassDetail,
  getClassSessions,
  updateSession,
} from '../../services/lecturerService';
import styles from './LecturerClassDetailPage.module.css';

const EMPTY_FORM = {
  sessionDate: '',
  startTime: '',
  endTime: '',
  title: '',
  detail: '',
  room: '',
};

const toDateInput = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;
};

const pad = (n) => String(n).padStart(2, '0');

const buildMonthDays = (year, month) => {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  return cells;
};

function LecturerClassDetailPage() {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [selectedDate, setSelectedDate] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [detail, sessionList] = await Promise.all([
        getClassDetail(classId),
        getClassSessions(classId),
      ]);
      setClassInfo(detail);
      setSessions(Array.isArray(sessionList) ? sessionList : []);
    } catch (err) {
      setError(err.message || 'Không tải được thông tin lớp.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = toDateInput(s.sessionDate);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  const monthCells = useMemo(
    () => buildMonthDays(viewMonth.year, viewMonth.month),
    [viewMonth]
  );

  const sessionsOnSelectedDate = selectedDate
    ? sessionsByDate[selectedDate] || []
    : [];

  const resetForm = (date = selectedDate) => {
    setEditingSessionId(null);
    setForm({ ...EMPTY_FORM, sessionDate: date || '' });
    setFormError('');
  };

  const openNewSession = (date) => {
    setSelectedDate(date);
    resetForm(date);
  };

  const openEditSession = (session) => {
    const dateKey = toDateInput(session.sessionDate);
    setSelectedDate(dateKey);
    setEditingSessionId(session.id);
    setForm({
      sessionDate: dateKey,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      title: session.title || '',
      detail: session.detail || '',
      room: session.room || '',
    });
    setFormError('');
  };

  const changeMonth = (delta) => {
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sessionDate || !form.title.trim()) {
      setFormError('Vui lòng nhập ngày và tiêu đề buổi học.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const body = {
        sessionDate: form.sessionDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        title: form.title.trim(),
        detail: form.detail || null,
        room: form.room || null,
      };

      if (editingSessionId) {
        await updateSession(classId, editingSessionId, body);
      } else {
        await createSession(classId, body);
      }

      await loadData();
      resetForm(form.sessionDate);
    } catch (err) {
      setFormError(err.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString(
    'vi-VN',
    { month: 'long', year: 'numeric' }
  );

  if (loading) {
    return <p className={styles.muted}>Đang tải...</p>;
  }

  if (error) {
    return (
      <div>
        <Link to="/lecturer/dashboard" className={styles.backLink}>← Quay lại</Link>
        <div className={styles.error} role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/lecturer/dashboard" className={styles.backLink}>← Danh sách lớp</Link>

      <header className={styles.header}>
        <p className={styles.code}>{classInfo?.courseCode}</p>
        <h1 className={styles.title}>{classInfo?.name}</h1>
        <p className={styles.subtitle}>
          {classInfo?.courseName} · {classInfo?.termName} · {classInfo?.studentCount} sinh viên
        </p>
        {classInfo?.courseDescription && (
          <p className={styles.description}>{classInfo.courseDescription}</p>
        )}
      </header>

      <div className={styles.layout}>
        <section className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <button type="button" className={styles.monthBtn} onClick={() => changeMonth(-1)}>
              ‹
            </button>
            <h2 className={styles.monthTitle}>{monthLabel}</h2>
            <button type="button" className={styles.monthBtn} onClick={() => changeMonth(1)}>
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {monthCells.map((dateKey, idx) => {
              if (!dateKey) {
                return <div key={`empty-${idx}`} className={styles.dayEmpty} />;
              }

              const daySessions = sessionsByDate[dateKey] || [];
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`${styles.dayCell} ${isSelected ? styles.daySelected : ''} ${
                    daySessions.length ? styles.dayHasSession : ''
                  }`}
                  onClick={() => openNewSession(dateKey)}
                >
                  <span className={styles.dayNumber}>{Number(dateKey.slice(8, 10))}</span>
                  {daySessions.length > 0 && (
                    <span className={styles.sessionDot}>{daySessions.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className={styles.dayList}>
              <h3 className={styles.dayListTitle}>
                Buổi học ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
              </h3>
              {sessionsOnSelectedDate.length === 0 && (
                <p className={styles.muted}>Chưa có buổi học. Dùng form bên phải để thêm.</p>
              )}
              <ul className={styles.sessionList}>
                {sessionsOnSelectedDate.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={styles.sessionItem}
                      onClick={() => openEditSession(s)}
                    >
                      <strong>{s.title}</strong>
                      {(s.startTime || s.endTime) && (
                        <span>
                          {s.startTime}
                          {s.endTime ? ` - ${s.endTime}` : ''}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {editingSessionId ? 'Chỉnh sửa buổi học' : 'Thêm buổi học mới'}
          </h2>

          {formError && <div className={styles.error} role="alert">{formError}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Ngày học
              <input
                type="date"
                name="sessionDate"
                className={styles.input}
                value={form.sessionDate}
                onChange={handleFormChange}
                required
              />
            </label>

            <div className={styles.row}>
              <label className={styles.label}>
                Giờ bắt đầu
                <input
                  type="time"
                  name="startTime"
                  className={styles.input}
                  value={form.startTime}
                  onChange={handleFormChange}
                />
              </label>
              <label className={styles.label}>
                Giờ kết thúc
                <input
                  type="time"
                  name="endTime"
                  className={styles.input}
                  value={form.endTime}
                  onChange={handleFormChange}
                />
              </label>
            </div>

            <label className={styles.label}>
              Tiêu đề buổi học
              <input
                type="text"
                name="title"
                className={styles.input}
                value={form.title}
                onChange={handleFormChange}
                placeholder="VD: Buổi 3 - React Hooks"
                required
              />
            </label>

            <label className={styles.label}>
              Phòng học
              <input
                type="text"
                name="room"
                className={styles.input}
                value={form.room}
                onChange={handleFormChange}
                placeholder="VD: P301"
              />
            </label>

            <label className={styles.label}>
              Chi tiết nội dung (flipped classroom)
              <textarea
                name="detail"
                className={styles.textarea}
                rows={8}
                value={form.detail}
                onChange={handleFormChange}
                placeholder="Video trước lớp, tài liệu, hoạt động trên lớp, bài tập..."
              />
            </label>

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Đang lưu...' : editingSessionId ? 'Cập nhật' : 'Thêm buổi học'}
              </button>
              {editingSessionId && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => resetForm(selectedDate)}
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default LecturerClassDetailPage;
