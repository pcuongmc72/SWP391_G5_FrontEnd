import { useMemo, useState } from 'react';
import { Check, Users, Search, Mail } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function ClassListDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [classListSearch, setClassListSearch] = useState('');

  const filteredStudents = useMemo(() => {
    if (!classListSearch.trim()) return users;
    const q = classListSearch.toLowerCase();
    return users.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [users, classListSearch]);

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
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Danh sách Học viên Lớp học</h3>
          <span style={{ fontSize: 12, padding: '4px 10px', background: '#ecfdf5', color: '#047857', borderRadius: 20, fontWeight: 700 }}>
            Sĩ số: {users.length} học viên
          </span>
        </div>

        <div className={styles.searchFilterBar} style={{ padding: '0 0 16px', borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
          <div className={styles.searchFilterInputWrap} style={{ maxWidth: 360 }}>
            <Search size={16} className={styles.searchFilterIcon} />
            <input
              type="text"
              placeholder="Tìm học viên theo tên, ID, email..."
              className={styles.searchFilterInput}
              value={classListSearch}
              onChange={(e) => setClassListSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Mã số ID</th>
                <th>Địa chỉ Email</th>
                <th>Vai trò lớp</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const isAssistant = student.role === 'assistant';
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={student.avatarUrl}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #cbd5e1' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{student.name}</span>
                      </div>
                    </td>
                    <td>{student.id}</td>
                    <td>
                      <a href={`mailto:${student.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', textDecoration: 'none' }}>
                        <Mail size={12} /> {student.email}
                      </a>
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${isAssistant ? styles.statusSuccess : styles.statusWarning}`}>
                        {isAssistant ? 'Trợ giảng' : 'Học viên'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                    Không tìm thấy học viên nào khớp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
