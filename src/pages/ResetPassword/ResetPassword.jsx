import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { resetPassword } from '../../services/authService';
import styles from './ResetPassword.module.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu mới';
    } else if (password.length < 6) {
      errs.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }
    
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setApiError('Token không tồn tại hoặc đã hết hạn. Vui lòng gửi lại yêu cầu Quên mật khẩu.');
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');
    setErrors({});

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 4000);
    } catch (err) {
      setApiError(err.message || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Lock className={styles.lockIcon} size={28} />
          </div>
          <h1 className={styles.title}>Đặt lại mật khẩu</h1>
          <p className={styles.subtitle}>
            Nhập mật khẩu mới cho tài khoản của bạn để hoàn tất quá trình khôi phục.
          </p>
        </div>

        {/* Lỗi Token thiếu hoặc lỗi API */}
        {!token && (
          <div className={styles.alertError} role="alert">
            <AlertTriangle size={18} />
            <span>Liên kết thiếu token khôi phục hợp lệ. Vui lòng kiểm tra lại email.</span>
          </div>
        )}

        {apiError && (
          <div className={styles.alertError} role="alert">
            <AlertTriangle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        {success ? (
          <div className={styles.successWrapper}>
            <div className={styles.successIconWrap}>
              <CheckCircle className={styles.successIcon} size={48} />
            </div>
            <h2 className={styles.successTitle}>Khôi phục hoạt động!</h2>
            <p className={styles.successDesc}>
              Mật khẩu mới của bạn đã được cập nhật thành công. Đang tự động chuyển hướng về trang chủ để đăng nhập trong giây lát...
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            
            {/* Mật khẩu mới */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-password">Mật khẩu mới</label>
              <div className={styles.inputWrap}>
                <input
                  id="new-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    if (apiError) setApiError('');
                  }}
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd((prev) => !prev)}
                  aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  disabled={loading || !token}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
              <div className={styles.inputWrap}>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPwd ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    if (apiError) setApiError('');
                  }}
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPwd((prev) => !prev)}
                  aria-label={showConfirmPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  disabled={loading || !token}
                >
                  {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </div>

            {/* Nút bấm (Debounce/Throttle khi bấm) */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !token}
            >
              {loading ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
