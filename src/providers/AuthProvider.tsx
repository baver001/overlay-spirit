import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UserAccount, UserRole } from '@/lib/types';

interface AuthContextValue {
  user: UserAccount | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requireRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'loverlay.auth';

interface StoredAuthState {
  user: UserAccount;
}

const MOCK_USERS: Array<UserAccount & { password: string }> = [
  {
    id: 'admin-1',
    email: 'admin@loverlay.app',
    name: 'Александр (админ)',
    role: 'admin',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    provider: 'local',
    password: 'admin123',
  },
  {
    id: 'user-1',
    email: 'user@loverlay.app',
    name: 'Мария',
    role: 'customer',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    provider: 'local',
    password: 'user123',
  },
];

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStatus('unauthenticated');
        return;
      }
      const parsed = JSON.parse(raw) as StoredAuthState;
      setUser(parsed.user);
      setStatus('authenticated');
    } catch (error) {
      console.error('Не удалось восстановить сессию', error);
      setStatus('unauthenticated');
    }
  }, []);

  const persist = useCallback((nextUser: UserAccount | null) => {
    if (!nextUser) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredAuthState = { user: nextUser };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const normalizedEmail = email.trim().toLowerCase();
    const found = MOCK_USERS.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    if (!found || found.password !== password) {
      throw new Error('Неверный email или пароль');
    }
    const { password: _ignore, ...publicUser } = found;
    setUser(publicUser);
    setStatus('authenticated');
    persist(publicUser);
  }, [persist]);

  const logout = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    setUser(null);
    setStatus('unauthenticated');
    persist(null);
  }, [persist]);

  const requireRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      if (user.role === role) return true;
      if (user.role === 'admin' && role === 'customer') return true; // админ имеет доступ ко всем клиентским разделам
      return false;
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(() => ({ user, status, login, logout, requireRole }), [user, status, login, logout, requireRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен вызываться внутри AuthProvider');
  return ctx;
}
