import { useMemo, useState } from 'react';
import { Check, X, TrendingUp, FileText, Users } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function ProgressDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading,
    materials
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [trackingStudent, setTrackingStudent] = useState(null);
  const [progressViewMode, setProgressViewMode] = useState('individual'); // individual, class
  const [trackingStudentTab, setTrackingStudentTab] = useState('completed'); // completed, pending

  const parseMaterialDesc = (rawDesc) => {
    if (!rawDesc) return { desc: '', publishDate: null, deadline: '', distributeMode: 'all', groups: [] };
    const clean = rawDesc.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const data = JSON.parse(clean);
        return {
          desc: data.desc || '',
          publishDate: data.publishDate || null,
          deadline: data.deadline || '',
          distributeMode: data.distributeMode || 'all',
          groups: data.groups || [],
        };
      } catch (e) {
        // fallback
      }
    }
    return { desc: rawDesc, publishDate: null, deadline: '', distributeMode: 'all', groups: [] };
  };

  const studentProgressData = useMemo(() => {
    return users.map((student) => {
      // Calculate how many materials this student has completed
      const totalMaterials = materials.filter(m => {
        // filter if materials are distributed to all or this student's group
        const meta = parseMaterialDesc(m.description);
        if (meta.distributeMode === 'all') return true;
        return meta.groups?.some(g => g.members?.some(mem => mem.id === student.id));
      });

      const completedMaterials = totalMaterials.filter((m) =>
        m.completedByUsers?.includes(student.id)
      );

      const percent = totalMaterials.length > 0
        ? Math.round((completedMaterials.length / totalMaterials.length) * 100)
        : 0;

      return {
        student,
        totalCount: totalMaterials.length,
        completedCount: completedMaterials.length,
        percent,
        completedList: completedMaterials,
        pendingList: totalMaterials.filter((m) => !m.completedByUsers?.includes(student.id)),
      };
    });
  }, [users, materials]);

  const materialsProgressData = useMemo(() => {
    return materials.map((m) => {
      const meta = parseMaterialDesc(m.description);
      const eligibleStudents = users.filter(s => {
        if (meta.distributeMode === 'all') return true;
        return meta.groups?.some(g => g.members?.some(mem => mem.id === s.id));
      });

      const completedCount = m.completedByUsers?.filter(id => eligibleStudents.some(s => s.id === id)).length || 0;
      const totalCount = eligibleStudents.length || 1;
      const percent = Math.round((completedCount / totalCount) * 100);

      return {
        material: m,
        completedCount,
        totalCount,
        percent,
      };
    });
  }, [materials, users]);

  const activeProgressRecord = studentProgressData.find((r) => r.student.id === trackingStudent?.id);

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

      <div className={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Báo cáo Tiến độ Lớp học</h3>
          <div className={styles.filterWrapper}>
            <button
              type="button"
              className={`${styles.filterBtn} ${progressViewMode === 'individual' ? styles.filterBtnActive : ''}`}
              onClick={() => { setProgressViewMode('individual'); setTrackingStudent(null); }}
            >
              Xem theo Học viên
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${progressViewMode === 'class' ? styles.filterBtnActive : ''}`}
              onClick={() => { setProgressViewMode('class'); setTrackingStudent(null); }}
            >
              Xem theo Học liệu
            </button>
          </div>
        </div>

        {progressViewMode === 'individual' ? (
          <div className={styles.feedbackWorkspace}>
            {/* Left list of students */}
            <div className={styles.feedbackListPanel}>
              {studentProgressData.map((record) => {
                const isSelected = record.student.id === trackingStudent?.id;
                return (
                  <div
                    key={record.student.id}
                    className={`${styles.feedbackItemCard} ${isSelected ? styles.feedbackItemCardActive : ''}`}
                    onClick={() => setTrackingStudent(record.student)}
                    style={{ padding: '12px 16px' }}
                  >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={record.student.avatarUrl}
                        alt=""
                        style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '2px solid #e2e8f0' }}
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {record.student.name || record.student.fullName || 'Học viên'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          <span>Hoàn thành: <strong style={{ color: '#0f172a' }}>{record.completedCount}/{record.totalCount}</strong></span>
                          <span style={{ fontWeight: 700, color: record.percent > 70 ? '#059669' : '#ea580c' }}>{record.percent}%</span>
                        </div>
                        <div style={{ marginTop: 4, height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${record.percent}%`, background: record.percent > 70 ? '#059669' : '#ea580c', borderRadius: 999, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right student completion details */}
            <div className={styles.feedbackDetailPanel}>
              {activeProgressRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                    <img
                      src={activeProgressRecord.student.avatarUrl}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: '50%' }}
                    />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{activeProgressRecord.student.name}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Mã học viên: {activeProgressRecord.student.id} · Email: {activeProgressRecord.student.email}
                      </p>
                    </div>
                  </div>

                  <div className={styles.filterWrapper} style={{ marginBottom: 16 }}>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${trackingStudentTab === 'completed' ? styles.filterBtnActive : ''}`}
                      onClick={() => setTrackingStudentTab('completed')}
                    >
                      Bài học đã xong ({activeProgressRecord.completedCount})
                    </button>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${trackingStudentTab === 'pending' ? styles.filterBtnActive : ''}`}
                      onClick={() => setTrackingStudentTab('pending')}
                    >
                      Bài học chưa xong ({activeProgressRecord.totalCount - activeProgressRecord.completedCount})
                    </button>
                  </div>

                  <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {trackingStudentTab === 'completed' ? (
                      activeProgressRecord.completedList.map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                          <Check size={16} color="#15803d" />
                          <div style={{ flexGrow: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#14532d' }}>{m.title}</span>
                            <small style={{ display: 'block', color: '#166534', fontSize: 11 }}>Chương: {m.chapter?.split(' ÷ ')?.[1] || m.chapter}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      activeProgressRecord.pendingList.map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                          <X size={16} color="#b91c1c" />
                          <div style={{ flexGrow: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#7f1d1d' }}>{m.title}</span>
                            <small style={{ display: 'block', color: '#991b1b', fontSize: 11 }}>Chương: {m.chapter?.split(' ÷ ')?.[1] || m.chapter}</small>
                          </div>
                        </div>
                      ))
                    )}

                    {(trackingStudentTab === 'completed' ? activeProgressRecord.completedList.length : activeProgressRecord.pendingList.length) === 0 && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 24 }}>Không có nội dung nào.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  <TrendingUp size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>Chọn một học viên bên trái để xem tiến trình học tập cụ thể.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tài liệu bài học</th>
                  <th>Chương học</th>
                  <th>Loại</th>
                  <th>Học viên tham gia nộp bài</th>
                  <th>Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {materialsProgressData.map((rec) => (
                  <tr key={rec.material.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="#64748b" />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{rec.material.title}</span>
                      </div>
                    </td>
                    <td>{rec.material.chapter?.split(' ÷ ')?.[1] || rec.material.chapter}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                      {rec.material.type}
                    </td>
                    <td>
                      <strong>{rec.completedCount} / {rec.totalCount}</strong> học viên
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={styles.progressBarTrack} style={{ width: 80, margin: 0 }}>
                          <div className={styles.progressBarFill} style={{ width: `${rec.percent}%`, background: rec.percent > 70 ? '#059669' : '#ea580c' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: rec.percent > 70 ? '#059669' : '#ea580c' }}>
                          {rec.percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {materialsProgressData.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                      Chưa có tài liệu học tập nào trong lớp học này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
