import { useState } from 'react';
import { Check, X, Award, ShieldCheck, ShieldMinus } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function PromotionDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { studentId, targetRole, studentName }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePromoteStudent = (studentId, currentRole, studentName) => {
    const targetRole = currentRole === 'assistant' ? 'student' : 'assistant';
    setConfirmModal({ studentId, targetRole, studentName });
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { studentId, targetRole } = confirmModal;
    setConfirmModal(null);
    try {
      await api.promoteStudent(studentId, targetRole);
      showToast(targetRole === 'assistant' ? 'Đã thăng cấp người hỗ trợ thành công!' : 'Đã hạ chức vụ người hỗ trợ.');
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
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Thăng cấp Học thuật (Hỗ trợ giảng dạy)</h3>
        </div>

        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
          Giảng viên có thể chọn tối đa các học viên ưu tú để thăng chức làm <strong>Hỗ trợ giảng dạy (Assistant)</strong>.
          Hỗ trợ giảng dạy sẽ được cấp thêm quyền xem và trả lời các thắc mắc (Feedback) của bạn cùng lớp nhằm tăng hiệu quả tự học.
        </p>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sinh viên</th>
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
                        {isAssistant ? 'Hỗ trợ (Assistant)' : 'Sinh viên (Student)'}
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
                        onClick={() => handlePromoteStudent(student.id, student.role, student.name)}
                      >
                        <Award size={12} />
                        {isAssistant ? 'Hạ cấp xuống sinh viên' : 'Thăng cấp làm người hỗ trợ'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>
                    Không tìm thấy sinh viên nào trong danh sách lớp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal xác nhận */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn .15s ease'
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            animation: 'slideUp .2s ease'
          }}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: confirmModal.targetRole === 'assistant' ? '#ecfdf5' : '#fef2f2',
            }}>
              {confirmModal.targetRole === 'assistant'
                ? <ShieldCheck size={28} color="#047857" />
                : <ShieldMinus size={28} color="#b91c1c" />}
            </div>

            {/* Tiêu đề */}
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
              {confirmModal.targetRole === 'assistant' ? 'Thăng cấp người hỗ trợ' : 'Hạ cấp sinh viên'}
            </h3>

            {/* Mô tả */}
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
              Bạn có chắc muốn{' '}
              <strong style={{ color: '#0f172a' }}>
                {confirmModal.targetRole === 'assistant' ? 'thăng cấp' : 'hạ cấp'}
              </strong>{' '}
              sinh viên <strong style={{ color: '#0f172a' }}>{confirmModal.studentName}</strong>{' '}
              {confirmModal.targetRole === 'assistant'
                ? 'lên làm người hỗ trợ?'
                : 'xuống sinh viên bình thường?'}
            </p>

            {/* Nút */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: '1.5px solid #e2e8f0',
                  background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', transition: 'background .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                  background: confirmModal.targetRole === 'assistant' ? '#059669' : '#dc2626',
                  color: '#fff', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', transition: 'opacity .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
