import React, { useState } from 'react';
import {
  Users, Plus, Edit2, Search, CheckCircle, Eye, EyeOff
} from 'lucide-react';

/**
 * AdminDashboard — Bảng điều khiển quản trị hệ thống (Presenter Component)
 * Dedicated solely to Account Management (CRUD) as requested by the user.
 */
function AdminDashboard({
  /* ── Core collections ── */
  users,
  setUsers,
  currentUser,
  isLoading,

  /* ── Presenter states from Container ── */
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
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
}) {
  const [showPassword, setShowPassword] = useState(false);

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
            <button onClick={() => handleOpenUserModal()}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer">
              <Plus className="h-4 w-4" /> Tạo tài khoản mới
            </button>
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
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${String(u.role).toUpperCase() === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                          String(u.role).toUpperCase() === 'LECTURER' ? 'bg-blue-100 text-blue-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <button 
                          onClick={() => {
                            if (String(u.role).toUpperCase() === 'ADMIN') {
                              showToast('Không thể thay đổi trạng thái tài khoản Admin!', 'error');
                              return;
                            }
                            handleToggleUserStatus(u.id);
                          }} 
                          title={String(u.role).toUpperCase() === 'ADMIN' ? "Không thể thay đổi trạng thái của tài khoản Admin" : "Bấm để thay đổi trạng thái"}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            String(u.role).toUpperCase() === 'ADMIN'
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            String(u.role).toUpperCase() === 'ADMIN'
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
                          {String(u.role).toUpperCase() === 'ADMIN' ? (
                            <span 
                              title="Không thể chỉnh sửa tài khoản Admin"
                              className="p-1 px-2.5 border border-slate-100 bg-slate-50 rounded-lg text-xs font-semibold text-slate-400 flex items-center gap-1 cursor-not-allowed">
                              <Edit2 className="h-3 w-3" /> Sửa
                            </span>
                          ) : (
                            <button onClick={() => handleOpenUserModal(u)}
                              className="p-1 px-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1 cursor-pointer">
                              <Edit2 className="h-3 w-3" /> Sửa
                            </button>
                          )}
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
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800">
                    <option value="Student">Student</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800">
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

    </div>
  );
}

export default AdminDashboard;
