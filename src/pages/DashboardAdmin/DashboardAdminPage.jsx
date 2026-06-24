import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, LogOut, BookOpen, Calendar, GraduationCap, MessageSquare
} from 'lucide-react';
import { logout, getUser } from '../../services/authService';
import { getUsers, createUser, updateUser } from '../../services/userService';
import { fetchAcademicTerms } from '../../services/academicTermService';
import styles from './DashboardAdminPage.module.css';
import AdminDashboard from './AdminDashboard';
import TermsDashboard from './TermsDashboard';
import ClassesDashboard from './ClassesDashboard';
import CoursesDashboard from './CoursesDashboard';
import SharedBlogForum from '../../components/SharedBlogForum/SharedBlogForum';

/* ── Sidebar tabs definition ── */
const SIDEBAR_TABS = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutGrid, path: '/dashboard/admin' },
  { key: 'accounts', label: 'Quản lý tài khoản', icon: Users, path: '/dashboard/admin/account-management' },
  { key: 'courses', label: 'Quản lý môn học', icon: GraduationCap, path: '/dashboard/admin/courses-management' },
  { key: 'terms', label: 'Quản lý kỳ học', icon: Calendar, path: '/dashboard/admin/terms-management' },
  { key: 'classes', label: 'Quản lý lớp học', icon: BookOpen, path: '/dashboard/admin/classes-management' },
  { key: 'blog', label: 'Blog & Diễn đàn', icon: MessageSquare, path: '/dashboard/admin/blog-management' },
];
/**
 * normalizeUser — Tự động chuẩn hóa dữ liệu từ backend trả về
 * Hỗ trợ linh hoạt cả PascalCase, camelCase và kiểu trạng thái (status).
 */
const normalizeUser = (u) => {
  if (!u) return null;

  let normalizedStatus = 'ACTIVE';
  const statusVal = u.status ?? u.Status;
  const activeVal = u.isActive ?? u.IsActive;

  if (typeof activeVal === 'boolean') {
    normalizedStatus = activeVal ? 'ACTIVE' : 'INACTIVE';
  } else if (typeof statusVal === 'boolean') {
    normalizedStatus = statusVal ? 'ACTIVE' : 'INACTIVE';
  } else if (statusVal !== undefined && statusVal !== null) {
    const s = String(statusVal).toUpperCase();
    normalizedStatus = (s === 'ACTIVE' || s === '1' || s === 'TRUE') ? 'ACTIVE' : 'INACTIVE';
  }

  const resolvedName = u.fullName ?? u.FullName ?? u.name ?? u.Name ?? u.fullname ?? 'Người dùng';
  return {
    id: u.id ?? u.Id ?? '',
    username: u.username ?? u.Username ?? '',
    name: resolvedName,
    email: u.email ?? u.Email ?? '',
    password: u.password ?? u.Password ?? '••••••••',
    role: (u.role ?? u.Role) ? (String(u.role ?? u.Role).charAt(0).toUpperCase() + String(u.role ?? u.Role).slice(1).toLowerCase()) : 'Student',
    status: normalizedStatus,
    avatarUrl: u.avatarUrl ?? u.AvatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}`
  };
};

/**
 * DashboardAdminPage — Bảng điều khiển quản trị (Page Container)
 * Dedicated solely to Account Management as requested by the user.
 */
function DashboardAdminPage() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  const isTabActive = location.pathname === '/dashboard/admin/account-management';

  /* ── Core collections ── */
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ── Shared terms state — fetch từ API khi app khởi động ── */
  const [terms, setTerms] = useState([]);

  /* Load terms một lần khi mount — dùng chung cho cả 2 tab Terms và Classes */
  useEffect(() => {
    fetchAcademicTerms()
      .then(data => {
        let termList = [];
        if (Array.isArray(data)) {
          termList = data;
        } else if (data && Array.isArray(data.data)) {
          termList = data.data;
        } else if (data && Array.isArray(data.items)) {
          termList = data.items;
        } else if (data && data.$values && Array.isArray(data.$values)) {
          termList = data.$values;
        } else if (data && typeof data === 'object') {
          const foundArray = Object.values(data).find(val => Array.isArray(val));
          if (foundArray) termList = foundArray;
        }

        setTerms(termList.map(t => ({
          id: t.id ?? t.Id ?? '',
          code: t.termCode ?? t.TermCode ?? '',
          name: t.name ?? t.Name ?? '',
          startDate: t.startDate ? t.startDate.substring(0, 10) : (t.StartDate ? t.StartDate.substring(0, 10) : ''),
          endDate: t.endDate ? t.endDate.substring(0, 10) : (t.EndDate ? t.EndDate.substring(0, 10) : ''),
        })));
      })
      .catch(() => { /* lỗi fetch terms — sẽ hiển thị trong TermsDashboard */ });
  }, []);

  // Helper to dynamically calculate term status based on dates
  const getDynamicTermStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return 'COMPLETED';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const start = new Date(startDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();

    const end = new Date(endDate);
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    if (today < startDay) return 'UPCOMING';
    if (today > endDay) return 'COMPLETED';
    return 'ACTIVE';
  };

  // Derive terms with dynamically calculated status
  const resolvedTerms = useMemo(() => {
    return terms.map(t => ({
      ...t,
      status: getDynamicTermStatus(t.startDate, t.endDate)
    }));
  }, [terms]);

  /* ── Term navigation ── */
  const [selectedTerm, setSelectedTerm] = useState(null);

  const resolvedSelectedTerm = useMemo(() => {
    if (!selectedTerm) return null;
    const termInList = resolvedTerms.find(t => t.id === selectedTerm.id);
    return termInList || {
      ...selectedTerm,
      status: getDynamicTermStatus(selectedTerm.startDate, selectedTerm.endDate)
    };
  }, [selectedTerm, resolvedTerms]);

  const handleTermsChange = useCallback((apiTerms) => {
    setTerms(apiTerms);
  }, []);

  const handleViewClasses = useCallback((term) => {
    setSelectedTerm(term);
    navigate('/dashboard/admin/classes-management');
  }, [navigate]);

  /* ── Sub-component states passed as props ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  /* ── Modal / Form States ── */
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ id: '', username: '', name: '', email: '', role: 'Student', status: 'ACTIVE', password: '' });

  /* ── Toast ── */
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load Users from API ── */
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const apiResponse = await getUsers();
      console.log('FLIPPED LMS API DIAGNOSTICS - /api/Users response:', apiResponse);

      let userList = [];
      if (Array.isArray(apiResponse)) {
        userList = apiResponse;
      } else if (apiResponse && Array.isArray(apiResponse.data)) {
        userList = apiResponse.data;
      } else if (apiResponse && Array.isArray(apiResponse.items)) {
        userList = apiResponse.items;
      } else if (apiResponse && Array.isArray(apiResponse.users)) {
        userList = apiResponse.users;
      } else if (apiResponse && apiResponse.$values && Array.isArray(apiResponse.$values)) {
        // C# EF Core JSON Reference Preserving ($values)
        userList = apiResponse.$values;
      } else if (apiResponse && typeof apiResponse === 'object') {
        const foundArray = Object.values(apiResponse).find(val => Array.isArray(val));
        if (foundArray) {
          userList = foundArray;
        }
      }

      if (userList.length === 0) {
        console.warn('FLIPPED LMS WARNING - Danh sách người dùng trống. Hãy kiểm tra xem cơ sở dữ liệu đã có dữ liệu chưa hoặc cấu hình proxy tại vite.config.js (đang trỏ tới port 5148).');
      }

      const normalized = userList.map(normalizeUser);
      setUsers(normalized);
    } catch (err) {
      console.error('FLIPPED LMS API ERROR:', err);
      showToast(
        `Không thể kết nối đến Backend: ${err.message}. Vui lòng kiểm tra Server Backend đã chạy chưa (đang trỏ tới port 5148 ở vite.config.js)!`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ── User CRUD ── */
  const handleOpenUserModal = (user) => {
    if (user && String(user.role).toUpperCase() === 'ADMIN') {
      showToast('Không thể chỉnh sửa tài khoản Admin!', 'error');
      return;
    }
    if (user) {
      setEditingUser(user);
      setUserForm({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: user.password ?? ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ id: '', username: '', name: '', email: '', role: 'Student', status: 'ACTIVE', password: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (editingUser && String(editingUser.role).toUpperCase() === 'ADMIN') {
      showToast('Không thể chỉnh sửa tài khoản Admin!', 'error');
      return;
    }
    const cleanId = userForm.id.trim();
    const cleanName = userForm.name.trim();
    const cleanEmail = userForm.email.trim();
    const cleanUsername = editingUser
      ? editingUser.username
      : (cleanEmail.includes('@') ? cleanEmail.split('@')[0].toLowerCase() : cleanId.toLowerCase());

    if (!editingUser && !cleanId) { showToast('Vui lòng điền mã định danh ID!', 'error'); return; }
    if (!cleanName || !cleanEmail) { showToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error'); return; }

    // Yêu cầu nhập mật khẩu cho tài khoản
    if (!userForm.password.trim()) {
      showToast('Vui lòng nhập mật khẩu cho tài khoản!', 'error');
      return;
    }

    const payload = {
      id: cleanId,
      username: cleanUsername,
      name: cleanName,
      fullName: cleanName,
      email: cleanEmail,
      role: userForm.role,
      status: userForm.status,
      isActive: userForm.status === 'ACTIVE',

      // PascalCase fallback for C# model binders
      Id: cleanId,
      Username: cleanUsername,
      Name: cleanName,
      FullName: cleanName,
      Email: cleanEmail,
      Role: userForm.role,
      Status: userForm.status,
      IsActive: userForm.status === 'ACTIVE'
    };

    // Nếu người dùng nhập mật khẩu thực tế (và khác với ký hiệu đại diện đại diện ••••••••), ta mới gửi lên để lưu
    const enteredPass = userForm.password.trim();
    if (enteredPass && enteredPass !== '••••••••') {
      payload.password = enteredPass;
      payload.Password = enteredPass;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);

        // Update local state
        setUsers(users.map(u => u.id === editingUser.id ? normalizeUser(payload) : u));
        showToast(`Đã cập nhật tài khoản ${cleanName} thành công!`);
      } else {
        // Front-end safety checks against current list
        if (users.some(u => u.id.trim().toLowerCase() === cleanId.toLowerCase())) {
          showToast('Mã định danh (ID) này đã tồn tại trên hệ thống!', 'error'); return;
        }
        if (users.some(u => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
          showToast('Địa chỉ Email đã tồn tại trên hệ thống!', 'error'); return;
        }

        const created = await createUser(payload);
        // Kiểm tra xem phản hồi trả về từ API có phải là đối tượng User hợp lệ không
        const isValidUserResponse = created && (created.id || created.Id || created.email || created.Email || created.username || created.Username);
        const normalized = normalizeUser(isValidUserResponse ? created : payload);

        setUsers([...users, normalized]);
        showToast(`Đã tạo tài khoản ${cleanName} thành công!`);
      }
      setIsUserModalOpen(false);
    } catch (err) {
      console.error('FLIPPED LMS SAVE USER FAILED. Detailed response:', err.response?.data || err);
      let detailedMsg = err.message || 'Không thể lưu thông tin tài khoản!';
      if (err.response?.data) {
        const data = err.response.data;
        detailedMsg = data.title ?? data.message ?? data.error ?? (typeof data === 'string' ? data : err.message);
        if (data.errors) {
          const firstErrKey = Object.keys(data.errors)[0];
          if (firstErrKey) {
            detailedMsg += ` (${firstErrKey}: ${data.errors[firstErrKey][0]})`;
          }
        }
      }
      showToast(`Không thể lưu tài khoản: ${detailedMsg}`, 'error');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (String(target.role).toUpperCase() === 'ADMIN') {
      showToast('Không thể thay đổi trạng thái tài khoản Admin!', 'error');
      return;
    }

    const nextStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const payload = {
      ...target,
      status: nextStatus,
      isActive: nextStatus === 'ACTIVE',
      IsActive: nextStatus === 'ACTIVE',
      Status: nextStatus,

      // PascalCase mapping for backend
      Id: target.id,
      Username: target.username,
      Name: target.name,
      Email: target.email,
      Role: target.role
    };

    try {
      await updateUser(userId, payload);

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      showToast(`Đã ${nextStatus === 'ACTIVE' ? 'kích hoạt lại' : 'vô hiệu hóa'} tài khoản thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể thay đổi trạng thái tài khoản!', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  return (
    <div className={styles.page}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}><BookOpen /></div>
          <div>
            <span className={styles.sidebarLogoText}>FLIPPED LMS</span>
            <span className={styles.sidebarLogoSub}>Quản trị viên</span>
          </div>
        </div>

        <nav className={styles.sidebarNav} aria-label="Admin navigation">
          <div className={styles.navGroupLabel}>Chức năng làm việc</div>
          {SIDEBAR_TABS.map(({ key, label, icon: Icon, path }) => {
            const isActive = location.pathname === path || (key === 'overview' && location.pathname === '/dashboard/admin/');
            return (
              <button key={key}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => navigate(path)}>
                <Icon className={styles.navIcon} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <button id="btn-logout" className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut className={styles.navIcon} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div />
          <div className={styles.topbarRight}>
            <div className={styles.userBadge}>
              <div className={styles.avatar} aria-hidden="true">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name || 'Quản trị viên'}</span>
                <span className={styles.userRole}>Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>
          {location.pathname === '/dashboard/admin' ? (
            /* ══ TRANG TỔNG QUAN (OVERVIEW) ══ */
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 font-display">Chào mừng đến với Hệ thống Quản trị!</h2>
                <p className="text-slate-500 text-sm mt-1">Dưới đây là một số thống kê nhanh và các công cụ làm việc dành riêng cho bạn.</p>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500">Tài khoản trên hệ thống</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
                  </div>
                </div>
              </div>


              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 border-dashed text-slate-600 text-sm">

              </div>
            </div>
          ) : location.pathname === '/dashboard/admin/courses-management' ? (
            /* ══ TRANG QUẢN LÝ KHÓA HỌC (COURSES MANAGEMENT) ══ */
            <CoursesDashboard
              toast={toast}
              showToast={showToast}
            />
          ) : location.pathname === '/dashboard/admin/terms-management' ? (
            /* ══ TRANG QUẢN LÝ KỲ HỌC (TERMS MANAGEMENT) ══ */
            <TermsDashboard
              onViewClasses={handleViewClasses}
              onTermsChange={handleTermsChange}
              toast={toast}
              showToast={showToast}
            />
          ) : location.pathname === '/dashboard/admin/classes-management' ? (
            /* ══ TRANG QUẢN LÝ LớP HỌC (CLASSES MANAGEMENT) ══ */
            <ClassesDashboard
              terms={resolvedTerms}
              selectedTerm={resolvedSelectedTerm}
              onTermChange={(t) => setSelectedTerm(t)}
              users={users}
              toast={toast}
              showToast={showToast}
            />
          ) : location.pathname === '/dashboard/admin/blog-management' ? (
            <SharedBlogForum />
          ) : (
            /* ══ TRANG QUẢN LÝ TÀI KHOẢN (ACCOUNT MANAGEMENT) ══ */
            <AdminDashboard
              users={users}
              setUsers={setUsers}
              currentUser={user}
              isLoading={isLoading}

              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              isUserModalOpen={isUserModalOpen}
              setIsUserModalOpen={setIsUserModalOpen}
              editingUser={editingUser}
              userForm={userForm}
              setUserForm={setUserForm}
              toast={toast}
              showToast={showToast}

              handleOpenUserModal={handleOpenUserModal}
              handleSaveUser={handleSaveUser}
              handleToggleUserStatus={handleToggleUserStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardAdminPage;