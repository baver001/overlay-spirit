import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, User, ArrowLeft, Activity, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/auth";

const navItems = [
  { to: "/account/dashboard", icon: LayoutDashboard, labelKey: "account.dashboard" },
  { to: "/account/purchases", icon: ShoppingBag, labelKey: "account.purchases" },
  { to: "/account/profile", icon: User, labelKey: "account.profile" },
] as const;

export const AccountLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isSuper = user ? isSuperAdmin(user.email) : false;

  const buildInfo = (window as any).__BUILD_INFO__ || {
    version: 'dev',
    buildDate: new Date().toISOString(),
  };

  const formatDate = (dateString: string) => {
    try {
      const locales: Record<string, string> = {
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'pt': 'pt-PT',
        'en': 'en-US'
      };
      const locale = locales[i18n.language] || 'en-US';
      return new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: 'hsl(215 27.9% 12%)',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 w-full items-center">
          {/* Логотип выровнен по сайдбару */}
          <div className="hidden md:flex md:w-64 items-center justify-center px-6 border-r border-border h-full">
            <a href="/" className="flex items-center">
              <img src="/assets/logo_white.svg" alt="Loverlay" className="h-4" />
            </a>
          </div>
          {/* Мобильный логотип */}
          <div className="flex md:hidden items-center px-4">
            <a href="/" className="flex items-center">
              <img src="/assets/logo_white.svg" alt="Loverlay" className="h-4" />
            </a>
          </div>

          {isSuper && (
            <div className="ml-4 hidden lg:flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-mono text-violet-400">
              <Activity className="w-3 h-3" />
              <span>v{buildInfo.version}</span>
              <span className="opacity-50">•</span>
              <span>{formatDate(buildInfo.buildDate)}</span>
            </div>
          )}
          
          <div className="flex flex-1 items-center justify-end gap-3 px-4">
            <LanguageSwitcher />
            <span className="text-sm text-muted-foreground hidden sm:flex items-center gap-1.5">
              {user.email}
              {isSuper && <Shield className="w-3 h-3 text-violet-400" />}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => logout()}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-background/70 backdrop-blur">
          <a 
            href="/" 
            className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('account.back_to_editor')}
          </a>
          <div className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('account.my_account')}
            </h2>
          </div>
          <nav className="flex-1 space-y-1 px-3 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    active && "bg-primary/10 text-foreground border border-primary/30"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                    "text-muted-foreground hover:text-foreground",
                    active && "text-primary"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer className="hidden md:block" />
    </div>
  );
};

export default AccountLayout;

