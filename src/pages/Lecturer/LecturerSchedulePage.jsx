import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import {
  createSession,
  deleteSession,
  getClassDetail,
  getClassSessions,
  updateSession,
} from '../../services/lecturerService';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerSchedulePage.module.css';

const EMPTY_FORM = {
  sessionDate: '',
  startTime: '',
  endTime: '',
  title: '',
  detail: '',
  room: '',
};

const pad = (n) => String(n).padStart(2, '0');
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push({ type: 'empty' });
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ type: 'day', dateKey: `${year}-${pad(month + 1)}-${pad(d)}`, day: d });
  }
  return cells;
};

const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function LecturerSchedulePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { myClassrooms, classesLoading, classesError } = useLecturerWorkspace();
  const [classInfo, setClassInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const now = new Date();
  const [viewMonth, setViewMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('list'); // 'list' | 'create' | 'edit'

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return parseDateKey(selectedDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

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
      setError(err.message || 'Không tải được lịch học.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      loadData();
    } else {
      setLoading(false);
      setError('');
    }
  }, [loadData, classId]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = (s.sessionDate || '').slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    );
    return map;
  }, [sessions]);

  const monthCells = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth]
  );

  const termStart = classInfo?.termStartDate?.slice?.(0, 10) || classInfo?.termStartDate;
  const termEnd = classInfo?.termEndDate?.slice?.(0, 10) || classInfo?.termEndDate;

  const isInTerm = (dateKey) => {
    if (!termStart || !termEnd) return true;
    return dateKey >= termStart && dateKey <= termEnd;
  };

  const getDayStatus = (dateKey) => {
    if (!isInTerm(dateKey)) return 'outside';
    const has = (sessionsByDate[dateKey] || []).length > 0;
    return has ? 'hasClass' : 'noClass';
  };

  const selectedSessions = selectedDate ? sessionsByDate[selectedDate] || [] : [];

  const openDay = (dateKey) => {
    setSelectedDate(dateKey);
    setEditingSessionId(null);
    setForm({ ...EMPTY_FORM, sessionDate: dateKey });
    setFormError('');
    setModalMode('list');
    setIsDayModalOpen(true);
  };

  const openEdit = (session) => {
    const key = (session.sessionDate || '').slice(0, 10);
    setSelectedDate(key);
    setEditingSessionId(session.id);
    setForm({
      sessionDate: key,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      title: session.title || '',
      detail: session.detail || '',
      room: session.room || '',
    });
    setFormError('');
    setModalMode('edit');
    setIsDayModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sessionDate || !form.title.trim()) {
      setFormError('Vui lòng nhập ngày và tiêu đề.');
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
      setEditingSessionId(null);
      setForm({ ...EMPTY_FORM, sessionDate: selectedDate });
      setModalMode('list');
    } catch (err) {
      setFormError(err.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Xóa buổi học này?')) return;
    try {
      await deleteSession(classId, sessionId);
      await loadData();
      setEditingSessionId(null);
      setForm({ ...EMPTY_FORM, sessionDate: selectedDate });
      setModalMode('list');
    } catch (err) {
      setFormError(err.message || 'Xóa thất bại.');
    }
  };

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  if (loading) return <p className={styles.muted}>{classId ? 'Đang tải lịch học...' : 'Đang tải danh sách lớp...'}</p>;

  if (!classId) {
    return (
      <div className={styles.page}>
        <Link to="/lecturer/dashboard" className={styles.back}>← Về dashboard</Link>

        <header className={styles.header}>
          <h1 className={styles.title}>Lịch buổi học</h1>
          <p className={styles.sub}>Chọn lớp để xem buổi học.</p>
        </header>

        {classesError && <div className={styles.error}>{classesError}</div>}

        <div className={styles.classList}>
          {myClassrooms.length === 0 && (
            <div className={styles.emptyList}>Chưa có lớp nào để hiển thị.</div>
          )}
          {myClassrooms.map((course) => (
            <button
              key={course.id}
              type="button"
              className={styles.classCard}
              onClick={() => navigate(`/lecturer/classes/${course.id}`)}
            >
              <div>
                <strong>{course.name}</strong>
                <p>{course.courseCode} · {course.termName}</p>
              </div>
              <span className={styles.viewBtn}>Xem lịch</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/lecturer/dashboard" className={styles.back}>← Về dashboard</Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Lịch giảng dạy — {classInfo?.name}</h1>
        <p className={styles.sub}>
          {classInfo?.courseCode} · {classInfo?.termName}
          {termStart && termEnd && ` · ${termStart} → ${termEnd}`}
        </p>
      </header>

      <div className={styles.legend}>
        <span><i className={`${styles.dot} ${styles.dotGreen}`} /> Có buổi học</span>
        <span><i className={`${styles.dot} ${styles.dotRed}`} /> Không có buổi (trong học kỳ)</span>
        <span><i className={`${styles.dot} ${styles.dotGray}`} /> Ngoài học kỳ</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.layout}>
        <section className={styles.calendarCard}>
          <div className={styles.calHead}>
            <button type="button" className={styles.navBtn} onClick={() => setViewMonth((m) => {
              const d = new Date(m.year, m.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
              <ChevronLeft size={18} />
            </button>
            <h2 className={styles.monthTitle}>{monthLabel}</h2>
            <button type="button" className={styles.navBtn} onClick={() => setViewMonth((m) => {
              const d = new Date(m.year, m.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
              <ChevronRight size={18} />
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                  <th key={d}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                for (let i = 0; i < monthCells.length; i += 7) {
                  rows.push(monthCells.slice(i, i + 7));
                }
                return rows.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((cell, ci) => {
                      if (cell.type === 'empty') {
                        return <td key={ci} className={styles.cellEmpty} />;
                      }
                      const status = getDayStatus(cell.dateKey);
                      const isSelected = selectedDate === cell.dateKey;
                      return (
                        <td key={ci} className={styles.cellWrap}>
                          <button
                            type="button"
                            className={`${styles.cell} ${styles[`cell_${status}`]} ${isSelected ? styles.cellSelected : ''}`}
                            onClick={() => openDay(cell.dateKey)}
                          >
                            <span className={styles.dayNum}>{cell.day}</span>
                            {status === 'hasClass' && <span className={styles.dotGreen} title="Có học">●</span>}
                            {status === 'noClass' && <span className={styles.dotRed} title="Không học">●</span>}
                            {status === 'outside' && <span className={styles.dotGray}>·</span>}
                          </button>
                        </td>
                      );
                    })}
                    {week.length < 7 &&
                      Array.from({ length: 7 - week.length }).map((_, i) => (
                        <td key={`pad-${i}`} className={styles.cellEmpty} />
                      ))}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </section>
      </div>

      {isDayModalOpen && selectedDate && (
        <div className={styles.modalOverlay} onClick={() => { setIsDayModalOpen(false); setEditingSessionId(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                {modalMode !== 'list' && (
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => {
                      setModalMode('list');
                      setEditingSessionId(null);
                      setFormError('');
                      setForm({ ...EMPTY_FORM, sessionDate: selectedDate });
                    }}
                  >
                    ← Quay lại
                  </button>
                )}
                <h3 className={styles.modalTitle} style={{ margin: 0 }}>
                  {modalMode === 'list' && `Chi tiết ca học: ${formattedDate}`}
                  {modalMode === 'create' && `Thêm ca học mới`}
                  {modalMode === 'edit' && `Chỉnh sửa ca học`}
                </h3>
              </div>
              <button type="button" className={styles.iconBtn} onClick={() => { setIsDayModalOpen(false); setEditingSessionId(null); }}>
                <X size={16} />
              </button>
            </div>

            {modalMode === 'list' && (
              <>
                <div className={styles.sessionList}>
                  {selectedSessions.length === 0 && (
                    <p className={styles.muted} style={{ textAlign: 'center', padding: '24px 0' }}>
                      Không có ca học nào trong ngày này.
                    </p>
                  )}
                  {selectedSessions.map((s) => (
                    <div
                      key={s.id}
                      className={styles.sessionCardInteractive}
                      onClick={() => openEdit(s)}
                    >
                      <div className={styles.sessionHead}>
                        <strong>{s.title}</strong>
                        <div className={styles.sessionActions} onClick={(e) => e.stopPropagation()}>
                          <button type="button" className={styles.linkBtn} onClick={() => openEdit(s)}>
                            Chi tiết
                          </button>
                          <button type="button" className={styles.dangerBtn} onClick={() => handleDelete(s.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className={styles.time}>
                        {(s.startTime || '--:--') + (s.endTime ? ` – ${s.endTime}` : '')}
                        {s.room ? ` · Phòng ${s.room}` : ''}
                      </p>
                      {s.detail && <p className={styles.detailTextShort}>{s.detail}</p>}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.addSessionBtn}
                  onClick={() => {
                    setEditingSessionId(null);
                    setForm({ ...EMPTY_FORM, sessionDate: selectedDate });
                    setFormError('');
                    setModalMode('create');
                  }}
                >
                  + Thêm ca học mới
                </button>
              </>
            )}

            {(modalMode === 'create' || modalMode === 'edit') && (
              <>
                {formError && <div className={styles.error}>{formError}</div>}
                <form className={styles.form} onSubmit={handleSubmit}>
                  <label>
                    Ngày học
                    <input type="date" name="sessionDate" value={form.sessionDate}
                      onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} required />
                  </label>
                  <div className={styles.row}>
                    <label>
                      Giờ bắt đầu
                      <input type="time" value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                    </label>
                    <label>
                      Giờ kết thúc
                      <input type="time" value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Tiêu đề ca học
                    <input type="text" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ví dụ: Kiểm tra giữa kỳ, Thực hành LAB 3..." />
                  </label>
                  <label>
                    Phòng học
                    <input type="text" value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Ví dụ: AL-L203, AL-R402" />
                  </label>
                  <label>
                    Mô tả chi tiết nội dung học
                    <textarea rows={4} value={form.detail}
                      onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Tóm tắt kiến thức, tài liệu cần chuẩn bị..." />
                  </label>
                  <div className={styles.formActions} style={{ marginTop: 12 }}>
                    <button type="submit" className={styles.primary} disabled={saving}>
                      {saving ? 'Đang lưu...' : modalMode === 'edit' ? 'Cập nhật' : 'Thêm ca học'}
                    </button>
                    {modalMode === 'edit' && (
                      <button
                        type="button"
                        className={styles.dangerActionBtn}
                        onClick={() => handleDelete(editingSessionId)}
                      >
                        Xóa ca học
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => {
                        setModalMode('list');
                        setEditingSessionId(null);
                        setFormError('');
                        setForm({ ...EMPTY_FORM, sessionDate: selectedDate });
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerSchedulePage;
