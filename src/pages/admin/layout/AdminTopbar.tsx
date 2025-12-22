import React from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAdminSession } from "../providers/AdminSessionProvider";
import { Button } from "@/components/ui/button";

export const AdminTopbar: React.FC = () => {
  const { user, logout } = useAdminSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center">
        {/* Логотип выровнен по левому краю контента (с учётом сайдбара) */}
        <div className="hidden md:flex md:w-64 lg:w-72 xl:w-80 items-center justify-center px-6 border-r border-border h-full">
          <Link to="/" className="flex items-center">
            <img src="/assets/logo_white.svg" alt="Loverlay" className="h-6" />
          </Link>
        </div>
        {/* Мобильный логотип */}
        <div className="flex md:hidden items-center px-4">
          <Link to="/" className="flex items-center">
            <img src="/assets/logo_white.svg" alt="Loverlay" className="h-6" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-6 px-6">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Admin dashboard</span>
          {user && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          )}
          <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};

