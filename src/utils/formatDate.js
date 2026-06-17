/**
 * formatDate — Các hàm xử lý ngày/giờ
 */

/**
 * Format ngày sang dạng dd/MM/yyyy
 * @param {Date|string|number} date
 * @returns {string}
 *
 * @example
 * formatDate(new Date()) // '20/05/2026'
 */
export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format ngày + giờ sang dạng dd/MM/yyyy HH:mm
 * @param {Date|string|number} date
 * @returns {string}
 *
 * @example
 * formatDateTime(new Date()) // '20/05/2026 13:45'
 */
export function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Tính khoảng cách thời gian từ date đến hiện tại (relative time)
 * @param {Date|string|number} date
 * @returns {string} Ví dụ: '3 giờ trước', '2 ngày trước'
 */
export function timeAgo(date) {
  if (!date) return '';

  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  const diffMs = new Date(date) - new Date();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second');
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(diffDays, 'day');
}
