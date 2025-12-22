import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  email: string;
  role: "admin";
}

interface AdminSessionContextValue {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export const AdminSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        return;
      }

      // Check role from metadata
      const role = session.user.user_metadata?.role;
      
      if (role !== 'admin') {
         // Allow explicit superuser by email
         if (session.user.email === 'pavel@pokataev.com') {
             // Continue as admin
         } else {
             setError("Недостаточно прав для доступа к админке");
             setUser(null);
             return;
         }
      }

      setUser({ 
        id: session.user.id, 
        email: session.user.email || '', 
        role: "admin" 
      });

    } catch (e: any) {
      setError(e.message || "Ошибка авторизации");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        refresh();
    });

    return () => {
        subscription.unsubscribe();
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AdminSessionContext.Provider value={{ user, loading, error, refresh, logout }}>
      {children}
    </AdminSessionContext.Provider>
  );
};

export function useAdminSession(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error("useAdminSession must be used within AdminSessionProvider");
  return ctx;
}
