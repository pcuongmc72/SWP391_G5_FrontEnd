import StudentDashboard from './StudentDashboard';
import StudentRoadmap from './StudentRoadmap';
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
                                {currentUser?.fullName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{currentUser?.fullName || 'Học viên'}</span>
                                <span className={styles.userRole}>Student</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                {/* Content Area */}
                {/* Content Area */}
                <div className={styles.content}>
                    {location.pathname === '/dashboard/student' ? (
                        <StudentDashboard />
                    ) : location.pathname === '/dashboard/student/roadmap' ? (
                        <StudentRoadmap />
                    ) : (
                        <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #e2e8f0' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Trang đang cập nhật</h2>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 6 }}>Nội dung đang được phát triển...</p>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}

export default DashbroadStudent;
