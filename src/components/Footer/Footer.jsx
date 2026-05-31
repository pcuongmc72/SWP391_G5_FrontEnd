import { BookOpen } from 'lucide-react';
import styles from './Footer.module.css';

/**
 * Footer — Footer cho layout công khai
 */
function Footer({ onNavigate }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>

          {/* ── Brand ── */}
          <div className={`${styles.col} ${styles.colBrand}`}>
            <div className={styles.brandRow}>
              <div className={styles.brandIcon}>
                <BookOpen className={styles.brandSvg} />
              </div>
              <span className={styles.brandName}>Flipped Classroom LMS</span>
            </div>
            <p className={styles.brandDesc}>
              Nền tảng Quản lý Học tập Đảo ngược xuất sắc. Giúp học viên nâng cao
              tính tự chủ, chuẩn bị bài giảng trước khi đến lớp và củng cố kiến
              thức cùng đội ngũ giảng viên giàu kinh nghiệm.
            </p>
          </div>

          {/* ── Mô hình đào tạo ── */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>Mô hình đào tạo</h4>
            <ul className={styles.colList}>
              <li><span className={styles.colLink}>Chuẩn bị trước bài giảng</span></li>
              <li><span className={styles.colLink}>Kiểm tra đầu giờ (Mini Quiz)</span></li>
              <li><span className={styles.colLink}>Thảo luận nhóm tại lớp</span></li>
              <li><span className={styles.colLink}>Bài tập thực chiến đồ án</span></li>
            </ul>
          </div>

          {/* ── Hỗ trợ & Liên hệ ── */}
          <div className={styles.col}>
            <h4 className={styles.colHeading}>Hỗ trợ &amp; Liên hệ</h4>
            <ul className={styles.colList}>
              <li><span>Hotline: 1900 6006</span></li>
              <li><span>Email: support@flippedlms.edu.vn</span></li>
              <li><span>Địa điểm: Trung tâm Công nghệ Số, Tòa nhà Đại học Flipped</span></li>
              <li><span>Google Workspace API Integrated</span></li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className={styles.bottom}>
          <p>© 2026 Flipped Classroom Learn Management System. Bảo lưu mọi quyền.</p>
          <span className={styles.credit}>Kiến trúc thiết kế bởi Frontend Architects</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
