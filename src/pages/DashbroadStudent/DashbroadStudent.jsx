import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    BookOpen, LogOut, BookMarked,
    Upload, MessageSquare, Star
} from 'lucide-react';
import { logout, getUser } from '../../services/authService';
import styles from './DashbroadStudent.module.css';

// Components
import StudentDashboard from './StudentDashboard';
import SharedBlogForum from '../../components/SharedBlogForum/SharedBlogForum';

/* ── Sidebar tabs cho student ── */
const SIDEBAR_TABS = [
    { key: 'classes', label: 'Lớp học của tôi', icon: BookOpen, path: '/dashboard/student' },
    { key: 'roadmap', label: 'Lộ trình học tập', icon: BookMarked, path: '/dashboard/student/roadmap' },
    { key: 'materials', label: 'Học liệu', icon: BookMarked, path: '/dashboard/student/materials' },
    { key: 'submissions', label: 'Bài tập và deadline', icon: Upload, path: '/dashboard/student/submissions' },
    { key: 'grades', label: 'Điểm và nhận xét', icon: Star, path: '/dashboard/student/grades' },

];

function DashbroadStudent() {
    const currentUser = useMemo(() => getUser(), []);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        window.location.replace('/');
    };

    const renderContent = () => {
        if (location.pathname === '/dashboard/student/forum') {
            return <SharedBlogForum />;
        }
        // Default to dashboard
        return <StudentDashboard />;
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
                                {currentUser?.fullName?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{currentUser?.fullName || 'Học viên'}</span>
                                <span className={styles.userRole}>Student</span>
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

export default DashbroadStudent;
