import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAdminSession } from "../providers/AdminSessionProvider";
import { isSuperAdmin } from "@/lib/auth";

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, error } = useAdminSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // Только суперадмин (pavel@pokataev.com) имеет доступ к админке
  if (error || !user || !isSuperAdmin(user.email)) {
    // Если пользователь залогинен, но не суперадмин - редирект в личный кабинет
    if (user) {
      return <Navigate to="/account" replace />;
    }
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

