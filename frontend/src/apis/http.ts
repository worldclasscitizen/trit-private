import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const apiClient = axios.create({
  baseURL: 'https://tritt.o-r.kr/api', // Standard Spring Boot port
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies to be sent with cross-origin requests
});

export const refreshClient = axios.create({
  baseURL: 'https://tritt.o-r.kr/api',
  withCredentials: true,
})

// Request interceptor for Proactive Token Refresh
apiClient.interceptors.request.use(async (config) => {
  // Pinia store must be instantiated inside the interceptor
  const authStore = useAuthStore();
  const { accessToken, accessTokenExpiresAt } = authStore;

  if (
    config.url?.startsWith('/auth/refresh') ||
    config.url?.startsWith('/auth/login')
  ) {
    delete config.headers?.Authorization
    return config;
  }

  if (accessToken && accessTokenExpiresAt) {
    const refreshBuffer = 60 * 1000;
    const isAboutToExpire = accessTokenExpiresAt < Date.now() + refreshBuffer;

    if (isAboutToExpire) {
      await authStore.refreshAccessToken();
    }
  }

  return config;
});


export default apiClient;

