import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinProject: () => {},
  leaveProject: () => {},
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (socket) { socket.disconnect(); setSocket(null); }
      return;
    }

    const newSocket = io(SOCKET_URL, { auth: { token: accessToken } });

    newSocket.on('connect', () => {
      // Admin joins the global feed room
      if (user?.role === 'ADMIN') {
        newSocket.emit('join_project', 'admin_feed');
      }
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [accessToken]);

  const joinProject = (projectId: string) => {
    if (socket) socket.emit('join_project', projectId);
  };

  const leaveProject = (projectId: string) => {
    if (socket) socket.emit('leave_project', projectId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinProject, leaveProject }}>
      {children}
    </SocketContext.Provider>
  );
};
