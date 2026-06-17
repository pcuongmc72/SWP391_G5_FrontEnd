import styles from './Button.module.css';

/**
 * Button — Component nút bấm tái sử dụng
 *
 * @param {object}  props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.fullWidth
 * @param {boolean} props.loading
 * @param {boolean} props.disabled
 * @param {React.ReactNode} props.children
 * @param {string}  props.className
 * @param {string}  props.type  - 'button' | 'submit' | 'reset'
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Button;
