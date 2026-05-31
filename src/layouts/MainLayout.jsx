import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import AuthModal from '../components/AuthModal/AuthModal';
import styles from './MainLayout.module.css';

/**
 * MainLayout — Layout chính cho các trang công khai
 * Bao gồm: Navbar sticky, Footer, và modal Auth
 */
function MainLayout({ onLogin }) {
  const [showLogin, setShowLogin]   = useState(false);
  const [activeView, setActiveView] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeView with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveView('home');
    else if (path.startsWith('/courses')) setActiveView('courses');
    else if (path.startsWith('/blog')) setActiveView('blog');
    else if (path.startsWith('/about')) setActiveView('about');
    else if (path.startsWith('/contact')) setActiveView('contact');
  }, [location.pathname]);

  const handleNavigate = (view) => {
    const routes = {
      home:    '/',
      courses: '/courses',
      blog:    '/blog',
      about:   '/about',
      contact: '/contact',
    };
    if (routes[view]) navigate(routes[view]);
  };

  return (
    <div className={styles.layout}>
      <Navbar
        onNavigate={handleNavigate}
        activeView={activeView}
        onOpenLogin={() => setShowLogin(true)}
      />

      <main className={styles.main} id="main-content">
        <Outlet />
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Modal đăng nhập */}
      {showLogin && (
        <AuthModal onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

export default MainLayout;
