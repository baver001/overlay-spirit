import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  role?: UserRole;
  redirectTo?: string;
  allowAdminFallback?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  role,
  redirectTo = '/?auth=1',
  allowAdminFallback = true,
  children,
}) => {
  const location = useLocation();
  const { user, status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground">
        Загружаем профиль...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (role) {
    if (user.role === role) {
      return <>{children ? children : <Outlet />}</>;
    }

    if (allowAdminFallback && user.role === 'admin' && role === 'customer') {
      return <>{children ? children : <Outlet />}</>;
    }

    return <Navigate to="/" replace />;
  }

  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;
