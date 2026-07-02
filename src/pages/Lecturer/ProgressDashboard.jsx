import { useMemo, useState } from 'react';
import { Check, X, TrendingUp, FileText, Users, BookOpen } from 'lucide-react';
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
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {studentProgressData.map((record) => (
                <div
                  key={record.student.id}
                  onClick={() => setTrackingStudent(record.student)}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img
                      src={record.student.avatarUrl}
                      alt=""
                      style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #e2e8f0' }}
                    />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.student.name || record.student.fullName || 'Học viên'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Mã: {record.student.id}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: '#475569' }}>Tiến độ: <strong>{record.completedCount}/{record.totalCount}</strong></span>
                      <strong style={{ color: record.percent > 70 ? '#059669' : '#ea580c' }}>{record.percent}%</strong>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${record.percent}%`, background: record.percent > 70 ? '#10b981' : '#f97316', borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Student Details */}
            {activeProgressRecord && (
              <div className={styles.modalOverlay} onClick={() => setTrackingStudent(null)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, padding: 0, overflow: 'hidden', height: 'auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <img
                          src={activeProgressRecord.student.avatarUrl}
                          alt=""
                          style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                        <div>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{activeProgressRecord.student.name}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Email: {activeProgressRecord.student.email}</p>
                          <div style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', background: '#e0f2fe', color: '#0284c7', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {activeProgressRecord.percent}% HOÀN THÀNH
                          </div>
                        </div>
                      </div>
                      <button type="button" className={styles.iconBtn} onClick={() => setTrackingStudent(null)}>
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: 24, overflowY: 'auto', flexGrow: 1 }}>
                    <div className={styles.subModalTabs} style={{ marginBottom: 20 }}>
                      <button
                        className={`${styles.subTab} ${trackingStudentTab === 'completed' ? styles.subTabActive : ''}`}
                        onClick={() => setTrackingStudentTab('completed')}
                      >
                        Đã xong ({activeProgressRecord.completedCount})
                      </button>
                      <button
                        className={`${styles.subTab} ${trackingStudentTab === 'pending' ? styles.subTabActive : ''}`}
                        onClick={() => setTrackingStudentTab('pending')}
                      >
                        Chưa xong ({activeProgressRecord.totalCount - activeProgressRecord.completedCount})
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {trackingStudentTab === 'completed' ? (
                        activeProgressRecord.completedList.map((m) => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                            <div style={{ background: '#dcfce7', padding: 8, borderRadius: 8 }}><Check size={18} color="#15803d" /></div>
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#14532d' }}>{m.title}</div>
                              <div style={{ color: '#166534', fontSize: 12, marginTop: 4 }}>Chương: {m.chapter?.split(' ÷ ')?.[1] || m.chapter}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        activeProgressRecord.pendingList.map((m) => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                            <div style={{ background: '#fee2e2', padding: 8, borderRadius: 8 }}><X size={18} color="#b91c1c" /></div>
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#7f1d1d' }}>{m.title}</div>
                              <div style={{ color: '#991b1b', fontSize: 12, marginTop: 4 }}>Chương: {m.chapter?.split(' ÷ ')?.[1] || m.chapter}</div>
                            </div>
                          </div>
                        ))
                      )}

                      {(trackingStudentTab === 'completed' ? activeProgressRecord.completedList.length : activeProgressRecord.pendingList.length) === 0 && (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 40 }}>Không có nội dung nào.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {(() => {
              const grouped = {};
              materialsProgressData.forEach(rec => {
                const chapter = rec.material.chapter?.split(' ÷ ')?.[1] || rec.material.chapter || 'Không thuộc chương nào';
                if (!grouped[chapter]) grouped[chapter] = [];
                grouped[chapter].push(rec);
              });

              if (Object.keys(grouped).length === 0) {
                return <div className={styles.emptyBox}>Chưa có tài liệu học tập nào trong lớp.</div>;
              }

              return Object.keys(grouped).map(chapter => (
                <div key={chapter} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BookOpen size={20} color="#0284c7" />
                    {chapter}
                  </div>
                  <div style={{ padding: '0 20px' }}>
                    {grouped[chapter].map((rec, idx) => (
                      <div key={rec.material.id} style={{ display: 'flex', alignItems: 'center', padding: '20px 0', borderBottom: idx < grouped[chapter].length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                        <div style={{ width: 300, flexShrink: 0, paddingRight: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <FileText size={18} color="#64748b" style={{ marginTop: 2 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', lineHeight: 1.4 }}>{rec.material.title}</div>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 6, letterSpacing: 0.5 }}>{rec.material.type}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ flexGrow: 1, paddingRight: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                            <span style={{ color: '#475569' }}>Tiến độ lớp: <strong style={{ color: '#0f172a' }}>{rec.completedCount} / {rec.totalCount} học viên</strong></span>
                            <span style={{ fontWeight: 700, color: rec.percent > 70 ? '#059669' : '#ea580c' }}>{rec.percent}%</span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${rec.percent}%`, background: rec.percent > 70 ? '#10b981' : '#f97316', borderRadius: 999, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
