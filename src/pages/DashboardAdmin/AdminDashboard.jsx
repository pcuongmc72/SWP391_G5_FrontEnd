import React, { useState, useRef } from 'react';
import {
  Plus, Edit2, Search, CheckCircle, Eye, EyeOff, Upload, Download, FileSpreadsheet, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { importUsers, downloadImportTemplate } from '../../services/userService';

/**
 * AdminDashboard — Bảng điều khiển quản trị hệ thống (Presenter Component)
 * Dedicated solely to Account Management (CRUD) as requested by the user.
 */
function AdminDashboard({
  /* ── Core collections ── */
  users,
  currentUser,
  isLoading,

  /* ── Presenter states from Container ── */
  isUserModalOpen,
  setIsUserModalOpen,
  editingUser,
  userForm,
  setUserForm,
  toast,
  showToast,

  /* ── Callbacks from Container ── */
  handleOpenUserModal,
  handleSaveUser,
  handleToggleUserStatus,
  fetchUsers,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportSearchQuery, setExportSearchQuery] = useState('');
  const [selectedExportIds, setSelectedExportIds] = useState([]);

  const handleExportCsv = () => {
    const studentsToExport = users.filter(u => 
      String(u.role).toUpperCase() === 'STUDENT' && 
      selectedExportIds.includes(u.id)
    );

    if (studentsToExport.length === 0) {
      showToast('Vui lòng chọn ít nhất một sinh viên để xuất file!', 'error');
      return;
    }

    const csvContent = "StudentId,FullName,Email\n" + 
      studentsToExport.map(s => `"${s.id}","${s.name}","${s.email}"`).join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_sinh_vien_export_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất ${studentsToExport.length} sinh viên thành công!`);
    setIsExportOpen(false);
    setSelectedExportIds([]);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('Đã tải file mẫu thành công!');
    } catch (err) {
      showToast('Không thể tải file mẫu: ' + err.message, 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportErrors([]);
      setImportSuccessMsg('');
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Vui lòng chọn một file để nhập!', 'error');
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    setImportSuccessMsg('');

    try {
      const res = await importUsers(importFile);
      const successCount = res.data?.successCount ?? res.data?.SuccessCount ?? res.SuccessCount ?? 0;
      setImportSuccessMsg(`Đã nhập thành công ${successCount} tài khoản vào hệ thống!`);
      showToast(`Nhập thành công ${successCount} tài khoản!`);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (typeof fetchUsers === 'function') {
        await fetchUsers();
      }
    } catch (err) {
      console.error('Import failed:', err);
      const errorData = err.response?.data?.data ?? err.response?.data;
      const errorList = errorData?.errors ?? errorData?.Errors;

      if (Array.isArray(errorList) && errorList.length > 0) {
        setImportErrors(errorList);
        showToast('Nhập file thất bại do có lỗi dữ liệu!', 'error');
      } else {
        const errorMsg = err.response?.data?.message ?? err.message ?? 'Đã xảy ra lỗi khi tải file lên!';
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  /* ── Derived data ── */
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || String(u.role).toUpperCase() === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const getRolePriority = (role) => {
    const r = String(role).toUpperCase();
    if (r === 'ADMIN') return 1;
    if (r === 'LECTURER') return 2;
    if (r === 'STUDENT') return 3;
    return 4;
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return getRolePriority(a.role) - getRolePriority(b.role);
  });

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toast && (
        <div style={{ zIndex: 9999 }} className={`fixed bottom-5 right-5 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl transition-all border ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Main Account Management View */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm min-h-[400px]">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">Danh sách Tài khoản</h2>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => { setIsImportOpen(true); setImportFile(null); setImportErrors([]); setImportSuccessMsg(''); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center">
                <Upload className="h-4 w-4" /> Nhập từ file
              </button>
              <button onClick={() => { setIsExportOpen(true); setSelectedExportIds([]); setExportSearchQuery(''); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center whitespace-nowrap">
                <Download className="h-4 w-4" /> Xuất file
              </button>
              <button onClick={() => handleOpenUserModal()}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer w-full sm:w-auto justify-center whitespace-nowrap">
                <Plus className="h-4 w-4" /> Tạo tài khoản mới
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Tìm tài khoản theo tên, email, ID..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800" />
            </div>
            <div className="flex gap-2">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800">
                <option value="ALL">Tất cả</option>
                <option value="Admin">Admin</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Student">Student</option>
              </select>
            </div>
          </div>

          {/* Account List Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Người dùng</th>
                  <th className="px-6 py-3 text-center">ID</th>
                  <th className="px-6 py-3 text-left">Vai trò</th>
                  <th className="px-6 py-3 text-left">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-slate-200 rounded-full" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-48 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-5 w-12 bg-slate-200 rounded-lg mx-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-16 bg-slate-200 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-24 bg-slate-200 rounded-full" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-7 w-12 bg-slate-200 rounded-lg" />
                          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                      Không tìm thấy tài khoản người dùng tương thích.
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatarUrl} alt={u.name}
                            onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`; }}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100" />
                          <div>
                            <p className="font-bold text-slate-800 flex items-center flex-wrap gap-2">
                              {u.name}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center text-xs bg-slate-100 font-mono text-slate-800 px-2.5 py-1 rounded-lg font-bold border border-slate-200">
                          {u.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${String(u.role || '').trim().toUpperCase() === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                          String(u.role || '').trim().toUpperCase() === 'LECTURER' ? 'bg-blue-100 text-blue-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <button
                          onClick={() => {
                            if (currentUser && currentUser.id === u.id) {
                              showToast('Không thể tự vô hiệu hóa tài khoản của chính mình!', 'error');
                              return;
                            }
                            handleToggleUserStatus(u.id);
                          }}
                          title={currentUser && currentUser.id === u.id ? "Không thể tự vô hiệu hóa tài khoản của chính mình" : "Bấm để thay đổi trạng thái"}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${currentUser && currentUser.id === u.id
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer'
                            }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${currentUser && currentUser.id === u.id
                            ? 'bg-slate-300'
                            : u.status === 'ACTIVE'
                              ? 'bg-emerald-600'
                              : 'bg-rose-600'
                            }`} />
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị Khóa'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenUserModal(u)}
                            className="p-1 px-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1 cursor-pointer">
                            <Edit2 className="h-3 w-3" /> Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ MODAL: Tạo/Sửa tài khoản ══ */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsUserModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</h3>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center mb-4">
              <img
                src={userForm.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userForm.name || 'User')}`}
                alt="Avatar Preview"
                onError={e => {
                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userForm.name || 'User')}`;
                }}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-emerald-50 shadow-md"
              />
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Mã ID {editingUser ? '' : <span className="text-rose-500">*</span>}
                </label>
                <input value={userForm.id} onChange={e => setUserForm({ ...userForm, id: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
                  placeholder="VD: SV001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên <span className="text-rose-500">*</span></label>
                <input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-rose-500">*</span></label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800" placeholder="example@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
                <input type="text" value={userForm.avatarUrl || ''} onChange={e => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800" placeholder="https://example.com/avatar.png" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
                <input value={userForm.avatarUrl || ''} onChange={e => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800" placeholder="https://example.com/avatar.png" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userForm.password || ''}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    placeholder="Nhập mật khẩu tài khoản"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    disabled={currentUser && currentUser.id === userForm.id}
                    title={currentUser && currentUser.id === userForm.id ? "Không thể tự thay đổi vai trò của chính mình" : ""}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100">
                    <option value="Student">Student</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                    disabled={currentUser && currentUser.id === userForm.id}
                    title={currentUser && currentUser.id === userForm.id ? "Không thể tự thay đổi trạng thái của chính mình" : ""}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100">
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Khóa</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Hủy</button>
                <button type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl cursor-pointer">
                  {editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Nhập tài khoản hàng loạt từ file ══ */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsImportOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-800 h-5 w-5" /> Nhập tài khoản hàng loạt
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Tải file biểu mẫu chuẩn</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Sử dụng file mẫu này để điền danh sách tài khoản.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> File mẫu (.csv)
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-700/50 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Upload className="h-10 w-10 text-slate-400 group-hover:text-emerald-800 transition-colors mb-3" />
                <p className="text-sm font-bold text-slate-700">Kéo thả file vào đây hoặc bấm để chọn</p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .xlsx, .xls, .csv</p>
              </div>

              {importFile && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-800" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">{importFile.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportFile(null)}
                    disabled={isImporting}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Lỗi Validation trả về từ Backend */}
              {importErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Lỗi định dạng dữ liệu ({importErrors.length} lỗi):</span>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1.5 text-xs text-rose-700 font-mono">
                    {importErrors.map((err, idx) => (
                      <div key={idx} className="bg-white/80 p-1.5 rounded border border-rose-100">
                        <span className="font-bold text-rose-800">Dòng {err.rowIndex ?? err.RowIndex}: </span>
                        <span>{err.errorMessage ?? err.ErrorMessage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thành công */}
              {importSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">Thành công!</h4>
                    <p className="text-xs text-emerald-700 mt-1">{importSuccessMsg}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                disabled={isImporting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Đóng
              </button>
              {importFile && (
                <button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={isImporting}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:bg-emerald-900/50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Đang nhập...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Bắt đầu Nhập
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Xuất danh sách sinh viên ra file ══ */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsExportOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-800 h-5 w-5" /> Xuất danh sách sinh viên
              </h3>
              <button onClick={() => setIsExportOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sinh viên theo tên, email, mã ID..."
                value={exportSearchQuery}
                onChange={e => setExportSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[40vh] border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {(() => {
                const filtered = users.filter(u => {
                  const isStudent = String(u.role).toUpperCase() === 'STUDENT';
                  const matchesSearch = 
                    u.name.toLowerCase().includes(exportSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(exportSearchQuery.toLowerCase()) ||
                    String(u.id).toLowerCase().includes(exportSearchQuery.toLowerCase());
                  return isStudent && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Không tìm thấy sinh viên nào.
                    </div>
                  );
                }

                const allFilteredIds = filtered.map(s => s.id);
                const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedExportIds.includes(id));

                return (
                  <>
                    {/* Header Select All */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/60 bg-slate-100/50 rounded-lg mb-2">
                      <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => {
                            if (allSelected) {
                              setSelectedExportIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                            } else {
                              setSelectedExportIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer h-4 w-4"
                        />
                        Chọn tất cả ({filtered.length} học viên)
                      </label>
                    </div>

                    {/* List Items */}
                    <div className="space-y-1">
                      {filtered.map(std => (
                        <div key={std.id} className="flex items-center justify-between p-2 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-100 transition-all">
                          <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 select-none">
                            <input
                              type="checkbox"
                              checked={selectedExportIds.includes(std.id)}
                              onChange={() => {
                                setSelectedExportIds(prev => 
                                  prev.includes(std.id) ? prev.filter(id => id !== std.id) : [...prev, std.id]
                                );
                              }}
                              className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer h-4 w-4"
                            />
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0 font-display">
                                {std.name ? std.name.split(' ').pop().substring(0, 2).toUpperCase() : 'SV'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{std.name}</p>
                                <p className="text-xs text-slate-400 truncate">{std.email} | ID: {std.id}</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-4">
              <span className="text-xs text-slate-500 font-semibold">
                Đã chọn: <span className="text-emerald-800 font-bold text-sm">{selectedExportIds.length}</span> sinh viên
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={selectedExportIds.length === 0}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Xuất file CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
