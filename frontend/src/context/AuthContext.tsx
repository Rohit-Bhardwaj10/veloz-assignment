import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'PM' | 'DEV';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (token: string | null) => {
    setAccessToken(token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
      delete api.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const response = await api.post('/auth/refresh', {});
        const newToken = response.data.accessToken;
        const decoded: any = jwtDecode(newToken);
        setToken(newToken);
        // Fetch full user info
        const userRes = await api.get('/meta/users', {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        const fullUser = userRes.data.find((u: User) => u.id === decoded.id);
        setUser(fullUser || { id: decoded.id, role: decoded.role, email: '' });
      } catch {
        console.log('No valid session');
      } finally {
        setLoading(false);
      }
    };
    silentRefresh();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};
