import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    BookOpen, LogOut, LayoutGrid, GraduationCap,
    Upload, MessageSquare, Star, BookMarked
} from 'lucide-react';
import { logout, getUser } from '../../services/authService';
import styles from './DashbroadStudent.module.css';

/* ── Sidebar tabs cho student ── */
const SIDEBAR_TABS = [
    { key: 'classes', label: 'Lớp học của tôi', icon: BookOpen, path: '/dashboard/student' },
    { key: 'roadmap', label: 'Lộ trình học tập', icon: BookMarked, path: '/dashboard/student/roadmap' },
    { key: 'materials', label: 'Học liệu', icon: BookMarked, path: '/dashboard/student/materials' },
    { key: 'submissions', label: 'Bài tập và deadline', icon: Upload, path: '/dashboard/student/submissions' },
    { key: 'grades', label: 'Điểm và nhận xét', icon: Star, path: '/dashboard/student/grades' },
    { key: 'forum', label: 'Blog thảo luận chung', icon: MessageSquare, path: '/dashboard/student/forum' },
];

function DashbroadStudent() {
    const currentUser = getUser();
    const navigate = useNavigate();
    const location = useLocation();

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
                        <span className={styles.sidebarLogoSub}>Học viên</span>
                    </div>
                </div>

                <nav className={styles.sidebarNav} aria-label="Student navigation">
                    <div className={styles.navGroupLabel}>Chức năng học tập</div>
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
                                {currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{currentUser?.name || 'Học viên'}</span>
                                <span className={styles.userRole}>Student</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className={styles.content}>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800">
                            Chào mừng, {currentUser?.name || 'Học viên'}! 👋
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Đây là trang học viên. Chức năng đầy đủ sẽ được thêm vào ở bước sau.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashbroadStudent;
