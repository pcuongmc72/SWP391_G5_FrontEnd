import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Upload, CheckSquare, MessageSquare, TrendingUp, Award,
  LogOut, Search, Bell, Calendar, ChevronDown,
  User, KeyRound, X, Pencil, Check, Mail, Phone, MapPin, Briefcase, Users,
} from 'lucide-react';
import { logout, updateProfile } from '../../services/authService';
import { getStoredUser, getUserDisplayName, persistAuth } from '../../utils/authStorage';
import { LecturerWorkspaceProvider, useLecturerWorkspace } from '../../context/LecturerWorkspaceContext';
import styles from './DashboardLecturerPage.module.css';

// Import subcomponents (to be extracted)
import MaterialsDashboard from './MaterialsDashboard';
import AssignmentsDashboard from './AssignmentsDashboard';
import GradingDashboard from './GradingDashboard';
import FeedbackDashboard from './FeedbackDashboard';
import ProgressDashboard from './ProgressDashboard';
import PromotionDashboard from './PromotionDashboard';
import ClassListDashboard from './ClassListDashboard';
import LecturerSchedulePage from './LecturerSchedulePage';

const SIDEBAR_ITEMS = [
  { id: 'materials',   label: 'Tài liệu học tập',    icon: BookOpen, path: '/dashboard/lecturer/materials' },
  { id: 'classList',   label: 'Danh sách lớp học',   icon: Users, path: '/dashboard/lecturer/classes-list' },
  { id: 'assignments', label: 'Bài tập & Đồ án',     icon: Upload, path: '/dashboard/lecturer/assignments' },
  { id: 'grading',    label: 'Chấm điểm nộp bài',   icon: CheckSquare, path: '/dashboard/lecturer/grading' },
  { id: 'feedback',   label: 'Phản hồi hỗ trợ',     icon: MessageSquare, path: '/dashboard/lecturer/feedback' },
  { id: 'progress',   label: 'Tiến độ học viên',     icon: TrendingUp, path: '/dashboard/lecturer/progress' },
  { id: 'promotion',  label: 'Thăng cấp học thuật',  icon: Award, path: '/dashboard/lecturer/promotion' },

];

/* ─── Profile Modal ─────────────────────────────────── */
function ProfileModal({ user, onClose }) {
  const [isEditing, setIsEditing]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState('');
  const [form, setForm]             = useState({
    fullName: user?.fullName || user?.name || '',
    email:    user?.email || '',
    phone:    user?.phone || '',
    address:  user?.address || '',
    bio:      user?.bio || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Gọi API cập nhật thông tin trong CSDL SQL Server
      const apiResponse = await updateProfile({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        bio: form.bio
      });
      
      const updatedUser = apiResponse.data || apiResponse;
      // Cập nhật thông tin trong localStorage và State
      const updated = { ...user, ...updatedUser };
      persistAuth({ token: localStorage.getItem('access_token'), user: updated });
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'lecturer'}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
        {/* Hero */}
        <div className={styles.modalHero}>
          <button className={styles.modalClose} onClick={onClose} type="button">
            <X size={16} />
          </button>
          <img src={avatarSrc} alt="" className={styles.heroAvatar} />
          <div className={styles.heroInfo}>
            <h2 className={styles.heroName}>{getUserDisplayName(user)}</h2>
            <span className={styles.heroBadge}>Giảng viên · Lecturer</span>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {success && (
            <div className={styles.successMsg}>
              <Check size={16} /> {success}
            </div>
          )}

          {/* Info Section */}
          {!isEditing ? (
            <>
              <div className={styles.modalSection}>
                <div className={styles.sectionTitle}>
                  <User size={14} /> Thông tin cá nhân
                </div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <div className={styles.infoLabel}><Mail size={11} style={{display:'inline',marginRight:4}}/>Email</div>
                    <div className={styles.infoValue}>{user?.email || '—'}</div>
                  </div>
                  <div className={styles.infoCard}>
                    <div className={styles.infoLabel}><Phone size={11} style={{display:'inline',marginRight:4}}/>Điện thoại</div>
                    <div className={styles.infoValue}>{user?.phone || '—'}</div>
                  </div>
                  <div className={styles.infoCard}>
                    <div className={styles.infoLabel}><MapPin size={11} style={{display:'inline',marginRight:4}}/>Địa chỉ</div>
                    <div className={styles.infoValue}>{user?.address || '—'}</div>
                  </div>
                  <div className={styles.infoCard}>
                    <div className={styles.infoLabel}><Briefcase size={11} style={{display:'inline',marginRight:4}}/>Vai trò</div>
                    <div className={styles.infoValue}>Lecturer</div>
                  </div>
                </div>
                {user?.bio && (
                  <div className={styles.infoCard} style={{ marginTop: 12 }}>
                    <div className={styles.infoLabel}>Giới thiệu</div>
                    <div className={styles.infoValue} style={{ fontWeight: 400, color: '#475569', fontSize: 13 }}>{user.bio}</div>
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.editToggle}
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil size={14} /> Chỉnh sửa thông tin
                </button>
              </div>
            </>
          ) : (
            <form className={styles.editForm} onSubmit={handleSave}>
              <div className={styles.sectionTitle}>
                <Pencil size={14} /> Chỉnh sửa thông tin
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Họ và tên</label>
                  <input
                    className={styles.formInput}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@fpt.edu.vn"
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Điện thoại</label>
                  <input
                    className={styles.formInput}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0912 345 678"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Địa chỉ</label>
                  <input
                    className={styles.formInput}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Hà Nội, Việt Nam"
                  />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Giới thiệu bản thân</label>
                <textarea
                  className={styles.formInput}
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tóm tắt kinh nghiệm giảng dạy..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsEditing(false)}>Hủy</button>
                <button type="submit" className={styles.btnSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}

          {/* Change Password Section */}
          <div className={styles.dropdownDivider} style={{ margin: '20px 0' }} />
          <ChangePasswordSection />
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg]     = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) { setMsg('Mật khẩu xác nhận không khớp.'); return; }
    if (form.next.length < 6)       { setMsg('Mật khẩu mới phải ít nhất 6 ký tự.'); return; }
    setSaving(true);
    // TODO: gọi API PUT /api/Auth/change-password
    setTimeout(() => {
      setMsg('Đổi mật khẩu thành công!');
      setForm({ current: '', next: '', confirm: '' });
      setSaving(false);
    }, 800);
  };

  return (
    <div className={styles.modalSection}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KeyRound size={14} /> Đổi mật khẩu
        </span>
        <button type="button" className={styles.editToggle} onClick={() => { setOpen(!open); setMsg(''); }}>
          {open ? 'Đóng' : 'Mở'}
        </button>
      </div>
      {open && (
        <form className={styles.editForm} onSubmit={handleChange}>
          {msg && <div className={styles.successMsg}>{msg}</div>}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Mật khẩu hiện tại</label>
            <input className={styles.formInput} type="password" value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })} required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Mật khẩu mới</label>
              <input className={styles.formInput} type="password" value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })} required />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Xác nhận mật khẩu</label>
              <input className={styles.formInput} type="password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ─── Main Layout Inner ─────────────────────────────── */
function LecturerLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getStoredUser();
  const {
    activeSubTab, setActiveSubTab,
    searchQuery,  setSearchQuery,
    feedbacks,
    classrooms, selectedClassId, setSelectedClassId, classesLoading
  } = useLecturerWorkspace();

  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  
  const dropdownRef = useRef(null);
  const classDropdownRef = useRef(null);

  const openFeedbackCount = feedbacks.filter((f) => f.status === 'OPEN').length;
  const avatarSrc = user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
  const activeClass = classrooms.find((c) => c.id === selectedClassId);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const openProfile = () => {
    setDropdownOpen(false);
    setProfileOpen(true);
  };

  return (
    <div className={styles.shell}>
      {/* ── Sidebar (Restored with Admin Sync Styling) ── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>FLIPPED LMS</div>
          <div className={styles.brandSub}>Giảng viên</div>
        </div>

        <div className={styles.sectionLabel}>CHỨC NĂNG LÀM VIỆC</div>

        <nav className={styles.nav} aria-label="Menu giảng viên">
          {(() => {
            const isScheduleActive = window.location.pathname.startsWith('/lecturer/classes');
            return (
              <>
                {SIDEBAR_ITEMS.map(({ id, label, icon: Icon, path }) => {
                  const isActive = location.pathname === path || (id === 'materials' && location.pathname === '/dashboard/lecturer');
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}
                      onClick={() => { setActiveSubTab(id); navigate(path); }}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`${styles.navBtn} ${isScheduleActive ? styles.navBtnActive : ''}`}
                  onClick={() => navigate('/dashboard/lecturer/schedule')}
                >
                  <Calendar size={18} />
                  <span>Lịch học</span>
                </button>
              </>
            );
          })()}
        </nav>

        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* ── Main Workspace Container ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          {/* Class Selector Dropdown */}
          <div className={styles.topbarLeft}>
            <div className={styles.classDropdownWrap} ref={classDropdownRef}>
              <button
                type="button"
                className={styles.classDropdownBtn}
                onClick={() => setClassDropdownOpen((p) => !p)}
                aria-haspopup="true"
                aria-expanded={classDropdownOpen}
              >
                <div className={styles.classDropdownInfo}>
                  <span className={styles.classDropdownActiveLabel}>Đang dạy:</span>
                  <span className={styles.classDropdownActiveName}>
                    {activeClass ? activeClass.name : (classesLoading ? 'Đang tải...' : 'Chọn lớp học')}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`${styles.classChevron} ${classDropdownOpen ? styles.classChevronOpen : ''}`}
                />
              </button>

              {classDropdownOpen && (
                <div className={styles.classDropdownMenu} role="menu">
                  {classrooms.map((c) => {
                    const isCurrent = c.id === selectedClassId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.classDropdownItem} ${isCurrent ? styles.classDropdownItemActive : ''}`}
                        onClick={() => {
                          setSelectedClassId(c.id);
                          setClassDropdownOpen(false);
                        }}
                        role="menuitem"
                      >
                        <div className={styles.classItemContent}>
                          <span className={styles.classItemName}>{c.name}</span>
                          <span className={styles.classItemTerm}>{c.termName || 'Spring 2027'}</span>
                        </div>
                        {isCurrent && <Check size={14} className={styles.checkIcon} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


          <div className={styles.topbarRight}>

            {/* Profile dropdown */}
            <div className={styles.profileWrap} ref={dropdownRef}>
              <button
                type="button"
                className={styles.userBadge}
                onClick={() => setDropdownOpen((p) => !p)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <img src={avatarSrc} alt="" className={styles.avatar} />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{getUserDisplayName(user)}</span>
                  <span className={styles.userRole}>Lecturer</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className={styles.profileDropdown} role="menu">
                  {/* Header mini */}
                  <div className={styles.dropdownHeader}>
                    <img src={avatarSrc} alt="" className={styles.dropdownAvatar} />
                    <p className={styles.dropdownName}>{getUserDisplayName(user)}</p>
                    <p className={styles.dropdownEmail}>{user?.email}</p>
                  </div>

                  <div className={styles.dropdownDivider} />

                  <button type="button" className={styles.dropdownItem} onClick={openProfile} role="menuitem">
                    <User size={15} /> Xem trang cá nhân
                  </button>

                  <div className={styles.dropdownDivider} />

                  <button type="button" className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout} role="menuitem">
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {location.pathname === '/dashboard/lecturer/classes-list' ? (
            <ClassListDashboard />
          ) : location.pathname === '/dashboard/lecturer/assignments' ? (
            <AssignmentsDashboard />
          ) : location.pathname === '/dashboard/lecturer/grading' ? (
            <GradingDashboard />
          ) : location.pathname === '/dashboard/lecturer/feedback' ? (
            <FeedbackDashboard />
          ) : location.pathname === '/dashboard/lecturer/progress' ? (
            <ProgressDashboard />
          ) : location.pathname === '/dashboard/lecturer/promotion' ? (
            <PromotionDashboard />
          ) : location.pathname === '/dashboard/lecturer/schedule' || location.pathname.startsWith('/dashboard/lecturer/schedule/') ? (
            <LecturerSchedulePage />
          ) : (
            <MaterialsDashboard />
          )}
        </div>
      </div>

      {/* ── Profile Modal ── */}
      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}

export default function DashboardLecturerPage() {
  return (
    <LecturerWorkspaceProvider>
      <LecturerLayoutInner />
    </LecturerWorkspaceProvider>
  );
}
