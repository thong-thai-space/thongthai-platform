'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import api, { API_BASE_URL } from './api';
import type { User } from '@/types';
import {
  fromBackendMotionPreference,
  MOTION_PREFERENCE_KEY,
} from './motion-settings';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<void>;
  loginWithGoogle: (redirectTo?: string) => void;
  register: (
    name: string,
    email: string,
    password: string,
    acceptTerms: boolean,
    turnstileToken?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isOwnerOrAdmin: boolean;
  isTeamMember: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const POST_AUTH_REDIRECT_KEY = 'tts_post_auth_redirect';

function shouldProbeSession(pathname?: string) {
  if (typeof window === 'undefined') return true;

  const currentPath = pathname || window.location.pathname;
  const isProtectedRoute = ['/dashboard', '/member', '/portal'].some(
    (path) => currentPath.startsWith(path),
  );
  const hasSessionHint = localStorage.getItem('tts_has_session') === '1';

  return isProtectedRoute || hasSessionHint;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => shouldProbeSession(pathname));

  useEffect(() => {
    if (!shouldProbeSession(pathname)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('tts_has_session', '1');
          localStorage.setItem(
            MOTION_PREFERENCE_KEY,
            fromBackendMotionPreference(data?.motionPreference),
          );
          window.dispatchEvent(new CustomEvent('tts-motion-preference-change'));
        }
      })
      .catch(() => {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tts_has_session');
        }
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  const login = useCallback(async (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      turnstileToken,
    });
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tts_has_session', '1');
    }
  }, []);

  const loginWithGoogle = useCallback((redirectTo?: string) => {
    if (typeof window !== 'undefined' && redirectTo) {
      localStorage.setItem(POST_AUTH_REDIRECT_KEY, redirectTo);
    }

    const baseUrl = String(api.defaults.baseURL || API_BASE_URL);
    window.location.href = `${baseUrl}/auth/google`;
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      acceptTerms: boolean,
      turnstileToken?: string,
    ) => {
      await api.post('/auth/register', {
        name,
        email,
        password,
        acceptTerms,
        turnstileToken,
      });
      // No login after register — user must verify email first
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors during logout
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tts_has_session');
    }
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          MOTION_PREFERENCE_KEY,
          fromBackendMotionPreference(data?.motionPreference),
        );
        window.dispatchEvent(new CustomEvent('tts-motion-preference-change'));
      }
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        isOwnerOrAdmin:
          user?.role === 'OWNER' || user?.role === 'ADMIN',
        isTeamMember: ['OWNER', 'ADMIN', 'MEMBER'].includes(user?.role || ''),
        isClient: user?.role === 'CLIENT',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
