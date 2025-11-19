import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

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

async function fetchMe(): Promise<AdminUser | null> {
  const res = await fetch("/api/auth", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.user || data.user.role !== "admin") {
    return null;
  }
  return { id: data.user.id, email: data.user.email, role: "admin" };
}

export const AdminSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetchMe();
      setUser(me);
      if (!me) {
        setError("Недостаточно прав для доступа к админке");
      }
    } catch (e: any) {
      setError(e.message || "Ошибка авторизации");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth?action=logout", { method: "POST", credentials: "include" });
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

