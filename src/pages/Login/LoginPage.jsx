import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, getRole, forgotPassword } from '../../services/authService';
import { getDashboardPathForRole } from '../../constants/roles';
import { parseLoginResponse, persistAuth } from '../../utils/authStorage';
import styles from './LoginPage.module.css';

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const emailRef = useRef(null);
  useEffect(() => { emailRef.current?.focus(); }, [mode]);

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (mode === 'login') {
      if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
      else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    }
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (apiErr) setApiErr('');
  };

  const switchToForgot = () => {
    setMode('forgot');
    setErrors({});
    setApiErr('');
    setSuccessMsg('');
  };

  const switchToLogin = () => {
    setMode('login');
    setErrors({});
    setApiErr('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiErr('');
    setSuccessMsg('');

    try {
      if (mode === 'forgot') {
        const response = await forgotPassword(form.email);
        setSuccessMsg(response?.message || 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.');
      } else {
        const response = await login(form.email, form.password);
        const { token: parsedToken, user: parsedUser } = parseLoginResponse(response);

        const token =
          parsedToken ||
          (typeof response === 'string' ? response : null) ||
          response?.token || response?.accessToken || response?.access_token ||
          response?.jwt || response?.data?.token || response?.data?.accessToken ||
          response?.data?.access_token || response?.data?.jwt;

        const user =
          parsedUser || response?.user || response?.userInfo ||
          response?.data?.user || response?.data?.userInfo;

        if (token && user) {
          persistAuth({ token, user });
          const role = user.role || user.Role || getRole() || '';
          navigate(getDashboardPathForRole(role), { replace: true });
        } else {
          setApiErr('Không nhận được thông tin xác thực. Vui lòng thử lại.');
        }
      }
    } catch (err) {
      setApiErr(err.message || (mode === 'forgot' ? 'Gửi yêu cầu thất bại. Vui lòng thử lại.' : 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Animated background blobs ── */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />
      <div className={styles.gridOverlay} />

      {/* ── Card ── */}
      <div className={styles.card}>

        {/* Left decorative column */}
        <div className={styles.cardLeft}>
          <div className={styles.logoMark}>
            <span className={styles.logoLetter}>F</span>
          </div>
          <h1 className={styles.leftTitle}>
            Học<br />smarter.
          </h1>
          <p className={styles.leftDesc}>
            Nền tảng lớp học đảo ngược — chủ động, hiệu quả, hiện đại.
          </p>

          {/* Decorative dots grid */}
          <div className={styles.dotsGrid}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={styles.dot} />
            ))}
          </div>
        </div>

        {/* Right form column */}
        <div className={styles.cardRight}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {mode === 'login' ? 'Đăng nhập' : 'Quên mật khẩu'}
            </h2>
            {mode === 'forgot' && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
              </p>
            )}
          </div>

          {/* API Error */}
          {apiErr && (
            <div className={styles.apiError} role="alert">
              ⚠️ {apiErr}
            </div>
          )}

          {/* Success message (forgot password) */}
          {successMsg && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              color: '#15803d', fontSize: '0.875rem',
              padding: '0.75rem 1rem', borderRadius: '0.75rem',
              marginBottom: '1rem', textAlign: 'center'
            }} role="alert">
              ✅ {successMsg}
            </div>
          )}

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
                disabled={loading || (mode === 'forgot' && !!successMsg)}
              />
              {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
            </div>

            {mode === 'login' ? (
              <>
                {/* Password */}
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="field-password">Mật khẩu</label>
                    <button
                      id="btn-forgot-password"
                      type="button"
                      className={styles.forgotBtn}
                      onClick={switchToForgot}
                      disabled={loading}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className={styles.pwdWrap}>
                    <input
                      id="field-password"
                      name="password"
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPwd(p => !p)}
                      aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      disabled={loading}
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
                </div>

                {/* Submit login */}
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
              </>
            ) : (
              <>
                {/* Submit forgot */}
                <button
                  id="btn-submit-forgot"
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || !!successMsg}
                >
                  {loading
                    ? <span className={styles.spinner} aria-hidden="true" />
                    : 'Gửi yêu cầu'}
                </button>

                {/* Back to login */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className={styles.forgotBtn}
                    onClick={switchToLogin}
                    disabled={loading}
                  >
                    ← Quay lại đăng nhập
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
