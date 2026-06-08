import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    BookOpen, LogOut, BookMarked,
    Upload, MessageSquare, Star, Users
} from 'lucide-react';
import { logout, getUser } from '../../services/authService';
import styles from './LecturerDashboard.module.css';

// Components
import SharedBlogForum from '../../components/SharedBlogForum/SharedBlogForum';

/* ── Sidebar tabs cho lecturer ── */
const SIDEBAR_TABS = [
    { key: 'classes', label: 'Lớp học giảng dạy', icon: BookOpen, path: '/dashboard/lecturer' },
    { key: 'schedule', label: 'Lịch dạy', icon: BookMarked, path: '/dashboard/lecturer/schedule' },
    { key: 'materials', label: 'Quản lý học liệu', icon: BookMarked, path: '/dashboard/lecturer/materials' },
    { key: 'assignments', label: 'Chấm bài tập', icon: Upload, path: '/dashboard/lecturer/assignments' },
    { key: 'forum', label: 'Blog thảo luận chung', icon: MessageSquare, path: '/dashboard/lecturer/forum' },
];

function LecturerDashboard() {
    const currentUser = useMemo(() => getUser(), []);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        window.location.replace('/');
    };

    const renderContent = () => {
        if (location.pathname === '/dashboard/lecturer/forum') {
            return <SharedBlogForum />;
        }
        // Default placeholder for other tabs
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Đang phát triển</h2>
                <p>Tính năng này sẽ sớm được ra mắt.</p>
            </div>
        );
    };

    return (
        <div className={styles.page}>
            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <div className={styles.sidebarLogoIcon}><BookOpen /></div>
                    <div>
                        <span className={styles.sidebarLogoText}>FLIPPED LMS</span>
                        <span className={styles.sidebarLogoSub}>Giảng viên</span>
                    </div>
                </div>

                <nav className={styles.sidebarNav} aria-label="Lecturer navigation">
                    <div className={styles.navGroupLabel}>Quản lý lớp học</div>
                    {SIDEBAR_TABS.map(({ key, label, icon: Icon, path }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={key}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => navigate(path)}
                            >
                                <Icon className={styles.navIcon} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </nav>

                <button className={styles.logoutBtn} onClick={handleLogout}>
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
                            <div className={styles.avatar}>
                                {currentUser?.fullName?.[0]?.toUpperCase() || 'L'}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{currentUser?.fullName || 'Giảng viên'}</span>
                                <span className={styles.userRole}>Lecturer</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default LecturerDashboard;
