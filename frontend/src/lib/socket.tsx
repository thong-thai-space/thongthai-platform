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
import { io, type Socket } from 'socket.io-client';

interface SocketContextType {
  getSocket: () => Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  getSocket: () => null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const getSocket = useCallback(() => socketRef.current, []);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

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
  }, []);

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
