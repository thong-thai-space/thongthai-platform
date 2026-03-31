'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api, { API_BASE_URL } from './api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    acceptTerms: boolean,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isOwnerOrAdmin: boolean;
  isTeamMember: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function shouldProbeSession() {
  if (typeof window === 'undefined') return true;

  const isProtectedRoute = ['/dashboard', '/member', '/portal'].some(
    (path) => window.location.pathname.startsWith(path),
  );
  const hasSessionHint = localStorage.getItem('tts_has_session') === '1';

  return isProtectedRoute || hasSessionHint;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(shouldProbeSession);

  useEffect(() => {
    if (!shouldProbeSession()) {
      return;
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('tts_has_session', '1');
        }
      })
      .catch(() => {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tts_has_session');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const turnstileToken = typeof window !== 'undefined' 
      ? localStorage.getItem('turnstile_token') || ''
      : '';
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

  const loginWithGoogle = useCallback(() => {
    const baseUrl = String(api.defaults.baseURL || API_BASE_URL);
    window.location.href = `${baseUrl}/auth/google`;
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      acceptTerms: boolean,
    ) => {
      const turnstileToken = typeof window !== 'undefined' 
        ? localStorage.getItem('turnstile_token') || ''
        : '';
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
