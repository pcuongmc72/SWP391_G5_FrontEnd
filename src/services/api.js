import axios from 'axios';

/**
 * Axios instance được cấu hình sẵn
 * Tất cả service files nên import từ đây, KHÔNG import axios trực tiếp.
 */

const api = axios.create({
  // Nếu VITE_API_BASE_URL để trống → dùng Vite proxy (/api/* → backend)
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/* ===========================
   Request Interceptor
   - Tự động đính kèm access token từ localStorage
   =========================== */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===========================
   Response Interceptor
   - Unwrap data từ response
   - Xử lý lỗi 401 (token hết hạn)
   =========================== */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const requestUrl = originalRequest.url || '';
    const isLoginRequest = requestUrl.toLowerCase().includes('/auth/login');

    if ((status === 400 || status === 401) && isLoginRequest) {
      return Promise.reject(new Error('Email hoặc mật khẩu không đúng. Vui lòng thử lại.'));
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // TODO: Implement token refresh logic here
      // await refreshToken();
      // return api(originalRequest);
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }

    // Chuẩn hóa error message
    let message = 'Đã xảy ra lỗi không xác định';
    
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      } else if (data.title) {
        // Dành cho ASP.NET Core ProblemDetails
        message = data.title;
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          if (firstErrorKey) message += ': ' + data.errors[firstErrorKey][0];
        }
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
