import { useMemo, useState } from 'react';
import { Check, X, CheckSquare, FileText, Pencil } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function GradingDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading,
    assignments, submissions, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState(10);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [activeAsgId, setActiveAsgId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const activeAsgIds = useMemo(() => assignments.map((a) => a.id), [assignments]);

  const activeSubmissions = useMemo(() => {
    return submissions.filter((s) => activeAsgIds.includes(s.assignmentId));
  }, [submissions, activeAsgIds]);

  const currentAsgId = activeAsgId || (assignments.length > 0 ? assignments[0].id : null);
  const currentAsg = assignments.find(a => a.id === currentAsgId);

  const currentSubmissions = useMemo(() => {
    if (!currentAsgId) return [];
    return submissions.filter((s) => s.assignmentId === currentAsgId);
  }, [submissions, currentAsgId]);

  const handleOpenGrading = (sub) => {
    const asg = assignments.find(a => a.id === sub.assignmentId);
    setGradingSubmission(sub);
    setGradeInput(sub.grade !== null ? sub.grade : (asg?.maxPoints || 10));
    setGradeFeedback(sub.feedback || '');
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      await api.gradeSubmission(gradingSubmission.id, {
        grade: Number(gradeInput),
        feedback: gradeFeedback,
      });
      setGradingSubmission(null);
      showToast('Đã chấm điểm & gửi phản hồi!');
    } catch (err) {
      showToast(err.message || 'Chấm điểm thất bại.', 'info');
    }
  };

  if (classesLoading || workspaceLoading) {
    return <p className={styles.loading}>Đang tải dữ liệu từ database...</p>;
  }

  return (
    <div className={styles.root}>
      {toast && (
        <div className={styles.toast}>
          <Check size={16} /> {toast.message}
        </div>
      )}

      {classesError && (
        <p className={styles.loading} style={{ color: '#b91c1c' }}>
          {classesError}
        </p>
      )}

        <div className={styles.splitLayout}>
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Danh sách Bài tập</h3>
            {assignments.length === 0 ? (
              <div className={styles.emptyBox}>Chưa có bài tập nào.</div>
            ) : (
              assignments.map(asg => {
                const asgPendingCount = submissions.filter(s => s.assignmentId === asg.id && s.status === 'SUBMITTED').length;
                return (
                  <button
                    key={asg.id}
                    type="button"
                    className={`${styles.sidebarItem} ${currentAsgId === asg.id ? styles.sidebarItemActive : ''}`}
                    onClick={() => setActiveAsgId(asg.id)}
                  >
                    <span>{asg.title}</span>
                    {asgPendingCount > 0 && (
                      <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                        {asgPendingCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          <div className={styles.mainContent}>
            <div className={styles.panel} style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>
                  {currentAsg ? `Chấm điểm: ${currentAsg.title}` : 'Chấm điểm bài nộp'}
                </h3>
                {currentAsgId && (
                  <span style={{ fontSize: 12, padding: '4px 10px', background: '#fef3c7', color: '#d97706', borderRadius: 20, fontWeight: 700 }}>
                    {submissions.filter(s => s.assignmentId === currentAsgId && s.status === 'SUBMITTED').length} bài đợi chấm
                  </span>
                )}
              </div>

              {currentAsgId ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Học viên</th>
                        <th>Tệp đính kèm</th>
                        <th>Thời gian nộp</th>
                        <th>Thời gian chấm</th>
                        <th>Trạng thái</th>
                        <th>Điểm số</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSubmissions.map((sub) => {
                        const student = users.find((s) => s.id === sub.studentId);
                        
                        return (
                          <tr key={sub.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img
                                  src={student?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sub.studentId}`}
                                  alt=""
                                  style={{ width: 28, height: 28, borderRadius: '50%' }}
                                />
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{sub.studentName || student?.name}</p>
                                  <small style={{ color: '#64748b' }}>{sub.studentId}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {sub.fileName ? (
                                <a href={`#download:${sub.fileName}`} className={styles.fileLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <FileText size={14} /> {sub.fileName}
                                </a>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: 12 }}>Không có file</span>
                              )}
                            </td>
                            <td>
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : 'N/A'}
                            </td>
                            <td>
                              {sub.gradedAt ? new Date(sub.gradedAt).toLocaleString('vi-VN') : '—'}
                            </td>
                            <td>
                              <span
                                className={`${styles.statusBadge} ${
                                  sub.status === 'GRADED'
                                    ? styles.statusSuccess
                                    : sub.status === 'SUBMITTED'
                                    ? styles.statusWarning
                                    : styles.statusDanger
                                }`}
                              >
                                {sub.status === 'GRADED' ? 'Đã chấm' : sub.status === 'SUBMITTED' ? 'Chưa chấm' : 'Chưa nộp'}
                              </span>
                            </td>
                            
                            <td style={{ fontWeight: 700, fontSize: 14 }}>
                              {sub.status === 'GRADED' ? `${sub.grade}/${currentAsg?.maxPoints || 10}` : '—'}
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                onClick={() => handleOpenGrading(sub)}
                              >
                                <Pencil size={11} /> {sub.status === 'GRADED' ? 'Sửa điểm' : 'Chấm điểm'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {currentSubmissions.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                            Chưa có bài nộp nào cho bài tập này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyBox}>Hãy chọn một bài tập ở danh sách bên trái để bắt đầu chấm điểm.</div>
              )}
            </div>
          </div>
        </div>

      {gradingSubmission && (
        <div className={styles.modalOverlay} onClick={() => setGradingSubmission(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={18} color="#059669" /> Chấm điểm & Phản hồi bài làm
              </h3>
              <button type="button" className={styles.iconBtn} onClick={() => setGradingSubmission(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitGrade}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Học viên: <strong>{gradingSubmission.studentName}</strong></p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#0f172a' }}>
                  Bài tập: <strong>{assignments.find(a => a.id === gradingSubmission.assignmentId)?.title}</strong>
                </p>
                {gradingSubmission.studentNotes && (
                  <p style={{ margin: '8px 0 0', padding: '6px 8px', background: '#fff', borderRadius: 6, fontSize: 11, color: '#475569', borderLeft: '3px solid #cbd5e1' }}>
                    Ghi chú của học viên: "{gradingSubmission.studentNotes}"
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label>Tệp đính kèm học viên nộp</label>
                {gradingSubmission.fileName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                    <FileText size={18} color="#059669" />
                    <a href={`#download:${gradingSubmission.fileName}`} style={{ fontSize: 12, fontWeight: 700, color: '#047857', textDecoration: 'underline' }}>
                      {gradingSubmission.fileName}
                    </a>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Học viên không đính kèm tệp tin.</span>
                )}
              </div>

              <div className={styles.field}>
                <label>Điểm số &nbsp;<span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={assignments.find(a => a.id === gradingSubmission.assignmentId)?.maxPoints || 10}
                  className={styles.input}
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                />
                <small style={{ color: '#64748b', marginTop: 2, display: 'block' }}>
                  Tối đa: {assignments.find(a => a.id === gradingSubmission.assignmentId)?.maxPoints || 10} điểm
                </small>
              </div>
              <div className={styles.field}>
                <label>Nhận xét / Phản hồi của giảng viên</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Viết nhận xét chi tiết, lỗi sai cần sửa..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>
                  Lưu điểm số & Gửi phản hồi
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ flex: 1 }}
                  onClick={() => setGradingSubmission(null)}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
