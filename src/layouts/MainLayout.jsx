import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import styles from './MainLayout.module.css';

/**
 * MainLayout — Layout chính cho các trang công khai
 * Bao gồm: Navbar sticky, Footer
 */
function MainLayout() {
  const [activeView, setActiveView] = useState('home');
  const navigate = useNavigate();

  const handleNavigate = (view) => {
    setActiveView(view);
    const routes = {
      home:    '/login',
      courses: '/courses',
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
      />

      <main className={styles.main} id="main-content">
        <Outlet />
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default MainLayout;
