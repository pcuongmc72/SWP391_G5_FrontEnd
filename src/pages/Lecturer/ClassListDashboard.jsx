import { useMemo, useState } from 'react';
import { Check, Users, Search, Mail, Award, ShieldCheck, ShieldMinus, X, Filter, ArrowDownAz, GraduationCap } from 'lucide-react';
import { useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './LecturerDashboard.module.css';

export default function ClassListDashboard() {
  const {
    users, classesLoading, classesError, workspaceLoading, api
  } = useLecturerWorkspace();

  const [toast, setToast] = useState(null);
  const [classListSearch, setClassListSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, assistant, student
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc, id_asc
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
      showToast(targetRole === 'assistant' ? 'Đã thăng cấp trợ giảng thành công!' : 'Đã hạ chức vụ trợ giảng.');
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại.', 'error');
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let result = users || [];

    // Filter by Role
    if (roleFilter === 'assistant') {
      result = result.filter(s => s.role === 'assistant');
    } else if (roleFilter === 'student') {
      result = result.filter(s => s.role !== 'assistant');
    }

    // Search
    if (classListSearch.trim()) {
      const q = classListSearch.toLowerCase();
      result = result.filter(
        (s) => s.name?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'id_asc') {
        return String(a.id || '').localeCompare(String(b.id || ''));
      }
      return 0;
    });

    return result;
  }, [users, classListSearch, roleFilter, sortBy]);

  const stats = useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      assistants: list.filter(u => u.role === 'assistant').length,
      students: list.filter(u => u.role !== 'assistant').length
    };
  }, [users]);

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

      <div className="flex flex-col gap-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Quản lý Lớp học & Học vụ</h3>
        </div>



        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Header & Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, ID, email..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
                value={classListSearch}
                onChange={(e) => setClassListSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
                <Filter size={14} className="text-gray-400 ml-1 mr-2" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none border-none cursor-pointer pr-1"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="assistant">Chỉ Trợ giảng</option>
                  <option value="student">Chỉ Học viên</option>
                </select>
              </div>

              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
                <ArrowDownAz size={14} className="text-gray-400 ml-1 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none border-none cursor-pointer pr-1"
                >
                  <option value="name_asc">Sắp xếp: Tên A-Z</option>
                  <option value="id_asc">Sắp xếp: Mã ID</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Học viên</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mã số ID</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ Email</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vai trò</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredAndSortedStudents.map((student) => {
                  const isAssistant = student.role === 'assistant';
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.id}`}
                            alt=""
                            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                          />
                          <span className="font-bold text-[13px] text-gray-900 group-hover:text-emerald-700 transition-colors">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-[13px] font-medium text-gray-600">{student.id}</td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                          <Mail size={14} /> {student.email}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isAssistant ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {isAssistant ? 'Trợ giảng' : 'Học viên'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          className={`inline-flex items-center justify-center min-w-[110px] gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 ${isAssistant ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'}`}
                          onClick={() => handlePromoteStudent(student.id, student.role, student.name)}
                        >
                          {isAssistant ? <ShieldMinus size={14} /> : <ShieldCheck size={14} />}
                          {isAssistant ? 'Hạ quyền' : 'Thăng cấp'}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredAndSortedStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Search size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Không tìm thấy học viên</p>
                      <p className="text-xs text-gray-500">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
              {confirmModal.targetRole === 'assistant' ? 'Thăng cấp Trợ giảng' : 'Hạ cấp Học viên'}
            </h3>

            {/* Mô tả */}
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
              Bạn có chắc muốn{' '}
              <strong style={{ color: '#0f172a' }}>
                {confirmModal.targetRole === 'assistant' ? 'thăng cấp' : 'hạ cấp'}
              </strong>{' '}
              học viên <strong style={{ color: '#0f172a' }}>{confirmModal.studentName}</strong>{' '}
              {confirmModal.targetRole === 'assistant'
                ? 'lên làm trợ giảng?'
                : 'xuống học viên bình thường?'}
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
