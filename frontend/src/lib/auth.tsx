'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from './api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(() => {
    const baseUrl = String(api.defaults.baseURL || 'http://localhost:4000/api');
    window.location.href = `${baseUrl}/auth/google`;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, acceptTerms: boolean) => {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        acceptTerms,
      });
      setUser(data.user);
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
