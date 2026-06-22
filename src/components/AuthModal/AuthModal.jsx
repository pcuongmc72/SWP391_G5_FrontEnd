import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, getRole } from '../../services/authService';
import { getDashboardPathForRole } from '../../constants/roles';
import { parseLoginResponse, persistAuth } from '../../utils/authStorage';
import styles from './AuthModal.module.css';

/**
 * AuthModal — Modal Đăng nhập (email + mật khẩu)
 * Sau khi đăng nhập thành công → chuyển theo role tương ứng (admin -> /dashboard/admin, lecturer -> /lecturer/dashboard, etc.)
 */
function AuthModal({ onClose }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const emailRef = useRef(null);

  // Focus email khi mở
  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Đóng bằng Escape
  // Chặn scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ─── Validate ───────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email không hợp lệ';
    }
    if (!form.password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (form.password.length < 6) {
      errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    }
    return errs;
  };

  /* ─── Handlers ───────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');

    try {
      const response = await login(form.email, form.password);

      // Log response ra console để debug
      console.log('API Response:', response);

      // Parse token và user từ response (Dùng logic mới từ HEAD để linh hoạt với API)
      const { token: parsedToken, user: parsedUser } = parseLoginResponse(response);

      // Fallback thủ công nếu parseLoginResponse không tìm được
      const token =
        parsedToken ||
        (typeof response === 'string' ? response : null) ||
        response?.token ||
        response?.accessToken ||
        response?.access_token ||
        response?.jwt ||
        response?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.access_token ||
        response?.data?.jwt;

      const user =
        parsedUser ||
        response?.user ||
        response?.userInfo ||
        response?.data?.user ||
        response?.data?.userInfo;

      if (token && user) {
        // Lưu token và user vào localStorage TRƯỚC khi navigate
        persistAuth({ token, user });

        // Lấy role từ user object (ưu tiên) hoặc từ localStorage
        const role = user.role || user.Role || getRole() || '';

        onClose();

        // Điều hướng theo role
        const path = getDashboardPathForRole(role);
        navigate(path, { replace: true });
      } else {
        // Không tìm thấy token hoặc user trong response
        setApiError(
          'Đăng nhập thành công nhưng không nhận được token hoặc thông tin người dùng. ' +
          'API trả về: ' + JSON.stringify(response)
        );
      }
    } catch (err) {
      setApiError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  /* ─── Render ─────────────────────────────── */
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.card}>
        {/* Close */}
        <button
          id="btn-modal-close"
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrap} aria-hidden="true">🔑</div>
          <h2 id="modal-title" className={styles.title}>Đăng nhập</h2>
          <p className={styles.subtitle}>Vui lòng nhập thông tin để tiếp tục.</p>
        </div>

        {/* Lỗi từ API */}
        {apiError && (
          <div className={styles.apiError} role="alert">
            ⚠️ {apiError}
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="field-email">Email</label>
            <input
              ref={emailRef}
              id="field-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          {/* Mật khẩu */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="field-password">Mật khẩu</label>
            <div className={styles.inputWrap}>
              <input
                id="field-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${styles.input} ${styles.inputPwd} ${errors.password ? styles.inputError : ''}`}
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd((p) => !p)}
                aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          {/* Quên mật khẩu */}
          <div className={styles.forgotRow}>
            <button id="btn-forgot-password" type="button" className={styles.forgotBtn}>
              Quên mật khẩu?
            </button>
          </div>

          {/* Submit */}
          <button
            id="btn-submit-login"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading
              ? <span className={styles.spinner} aria-hidden="true" />
              : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
