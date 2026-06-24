import { logout } from '../../services/authService';
import { getStoredUser, getUserDisplayName } from '../../utils/authStorage';
import styles from './DashboardPage.module.css';

function DashboardPage() {
  const user = getStoredUser();

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>MyApp</div>

        <nav className={styles.sidebarNav} aria-label="Dashboard navigation">
          <a href="#" className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>📊</span>
            <span>Tổng quan</span>
          </a>
          <a href="#" className={styles.navItem}>
            <span className={styles.navIcon}>👤</span>
            <span>Hồ sơ</span>
          </a>
          <a href="#" className={styles.navItem}>
            <span className={styles.navIcon}>⚙️</span>
            <span>Cài đặt</span>
          </a>
        </nav>

        <button
          id="btn-logout"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          <span>🚪</span> Đăng xuất
        </button>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Tổng quan</h1>
            <p className={styles.pageSubtitle}>Chào mừng trở lại!</p>
          </div>
          <div className={styles.userBadge}>
            <div className={styles.avatar} aria-hidden="true">
              {getUserDisplayName(user)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{getUserDisplayName(user)}</span>
              <span className={styles.userEmail}>{user?.email || ''}</span>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}

export default DashboardPage;
