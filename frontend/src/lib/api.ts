import axios from 'axios';

const resolveApiBaseUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'thongthaispace.com' || host.endsWith('.thongthaispace.com')) {
      return 'https://api.thongthaispace.com/api/v1';
    }
  }

  return 'http://localhost:4000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Refresh token mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (!error) prom.resolve();
    else prom.reject(error);
  });
  failedQueue = [];
};

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || '');
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me', '/auth/logout'].some((path) =>
      requestUrl.includes(path),
    );

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
            (path) => window.location.pathname.startsWith(path),
          );
          const isProtectedPage = ['/dashboard', '/member', '/portal'].some((path) =>
            window.location.pathname.startsWith(path),
          );

          // Redirect to login only from protected areas; keep public pages stable.
          if (!isAuthPage && isProtectedPage) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
