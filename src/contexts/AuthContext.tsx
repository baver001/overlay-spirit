import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWithAuth } from '@/lib/api';

interface UserInfo {
  id: string;
  email: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToD1 = async () => {
    try {
      const res = await fetchWithAuth('/api/verify');
      if (res.ok) {
        const data = await res.json();
        console.log('[AuthContext] User synced to D1:', data.user);
        return data.user;
      }
    } catch (error) {
      console.warn('[AuthContext] Failed to sync user to D1:', error);
    }
    return null;
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const role = (session.user.user_metadata?.role as 'admin' | 'customer') || 'customer';
        
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: role,
        });

        // Trigger sync to D1 in background
        syncUserToD1();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
       if (session?.user) {
        const role = (session.user.user_metadata?.role as 'admin' | 'customer') || 'customer';
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: role,
        });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          syncUserToD1();
        }
       } else {
         setUser(null);
       }
       setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
