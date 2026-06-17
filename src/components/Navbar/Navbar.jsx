import { BookOpen } from 'lucide-react';
import styles from './Navbar.module.css';

/**
 * Navbar — Thanh điều hướng sticky cho layout công khai
 * Props:
 *   onNavigate(view)   — điều hướng theo view key
 *   activeView         — view đang active
 *   onOpenLogin()      — mở modal đăng nhập
 *   onOpenRegister()   — mở modal đăng ký
 */
function Navbar({ onNavigate, activeView, onOpenLogin }) {
  const navItems = [
    { key: 'home',    label: 'Trang chủ' },
    { key: 'courses', label: 'Khóa học' },

    { key: 'about',   label: 'Giới thiệu' },
    { key: 'contact', label: 'Liên hệ' },
  ];

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>

        {/* ── Logo ── */}
        <div
          className={styles.logoGroup}
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
          aria-label="Trang chủ"
        >
          <div className={styles.logoIcon}>
            <BookOpen className={styles.logoSvg} />
          </div>
          <div>
            <span className={styles.logoTitle}>Flipped Classroom LMS</span>
            <span className={styles.logoSub}>Mô hình tự học lớp đảo ngược</span>
          </div>
        </div>

        {/* ── Nav Menu ── */}
        <nav className={styles.navMenu} aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              className={`${styles.navBtn} ${activeView === item.key ? styles.navBtnActive : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
              {activeView === item.key && (
                <span className={styles.navUnderline} aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>

        {/* ── Auth Actions ── */}
        <div className={styles.actions}>
          <button
            id="btn-login"
            className={styles.btnPrimary}
            onClick={onOpenLogin}
          >
            Đăng nhập
          </button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
