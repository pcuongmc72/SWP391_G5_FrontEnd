import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';


function Navbar({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="Trang chủ">
          MyApp
        </Link>

        {/* Auth buttons */}
        <div className={styles.actions}>
          <button
            id="btn-login"
            className={styles.btnPrimary}
            onClick={onLogin}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
