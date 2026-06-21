import { useState } from 'react';
import { Check, X, Award } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function PromotionDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePromoteStudent = async (studentId, currentRole) => {
    const targetRole = currentRole === 'assistant' ? 'student' : 'assistant';
    const actionText = targetRole === 'assistant' ? 'thăng cấp Trợ giảng' : 'hạ xuống học viên bình thường';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho học viên này?`)) return;

    try {
      await api.promoteStudent(studentId, targetRole);
      showToast(targetRole === 'assistant' ? 'Đã thăng cấp trợ giảng thành công!' : 'Đã hạ chức vụ trợ giảng.');
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại.', 'info');
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

      <div className={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Thăng cấp Học thuật (Trợ giảng lớp học)</h3>
        </div>

        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
          Giảng viên có thể chọn tối đa các học viên ưu tú để thăng chức làm <strong>Trợ giảng (Assistant)</strong>. 
          Trợ giảng sẽ được cấp thêm quyền xem và trả lời các thắc mắc (Feedback) của bạn cùng lớp nhằm tăng hiệu quả tự học.
        </p>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Mã số ID</th>
                <th>Địa chỉ Email</th>
                <th>Chức danh Hiện tại</th>
                <th>Thao tác thăng chức</th>
              </tr>
            </thead>
            <tbody>
              {users.map((student) => {
                const isAssistant = student.role === 'assistant';
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={student.avatarUrl}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: '50%' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{student.name}</span>
                      </div>
                    </td>
                    <td>{student.id}</td>
                    <td>{student.email}</td>
                    <td>
                      <span className={`${styles.statusPill} ${isAssistant ? styles.statusSuccess : styles.statusWarning}`}>
                        {isAssistant ? 'Trợ giảng (Assistant)' : 'Học sinh (Student)'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.btnSecondary}`}
                        style={{
                          padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: isAssistant ? '#fef2f2' : '#ecfdf5',
                          color: isAssistant ? '#b91c1c' : '#047857',
                          borderColor: isAssistant ? '#fca5a5' : '#a7f3d0'
                        }}
                        onClick={() => handlePromoteStudent(student.id, student.role)}
                      >
                        <Award size={12} />
                        {isAssistant ? 'Hạ cấp xuống Học viên' : 'Thăng cấp làm Trợ giảng'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                    Không tìm thấy học viên nào trong danh sách lớp.
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
