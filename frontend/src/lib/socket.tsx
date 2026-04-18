'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';
import { useAuth } from './auth';

const resolveSocketUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  return API_BASE_URL.replace(/\/api$/, '');
};

interface SocketContextType {
  getSocket: () => Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  getSocket: () => null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const getSocket = useCallback(() => socketRef.current, []);

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/member') ||
    pathname.startsWith('/portal');

  const hasSessionHint =
    typeof window !== 'undefined' && localStorage.getItem('tts_has_session') === '1';

  const shouldConnect = Boolean(user) || (!loading && (isProtectedPath || hasSessionHint));

  useEffect(() => {
    if (!shouldConnect) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socketUrl = resolveSocketUrl();

    const s = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [shouldConnect]);

  return (
    <SocketContext.Provider value={{ getSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const { getSocket, isConnected } = useContext(SocketContext);
  return { socket: getSocket(), isConnected };
}
