import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import styles from './MainLayout.module.css';

function MainLayout({ onLogin, onRegister }) {
  return (
    <div className={styles.layout}>
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <main className={styles.main} id="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
