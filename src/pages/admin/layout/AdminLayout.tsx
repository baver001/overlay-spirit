import React from "react";
import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminTopbar } from "./AdminTopbar";
import { AdminGuard } from "../modules/AdminGuard";
import { AdminSessionProvider } from "../providers/AdminSessionProvider";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const navItems = [
  { to: "/admin/dashboard", icon: "LayoutDashboard", labelKey: "admin.dashboard" },
  { to: "/admin/categories", icon: "FolderKanban", labelKey: "admin.categories" },
  { to: "/admin/sets", icon: "Boxes", labelKey: "admin.sets" },
  { to: "/admin/users", icon: "Users", labelKey: "admin.users" },
  { to: "/admin/purchases", icon: "CreditCard", labelKey: "admin.purchases" },
  { to: "/admin/settings", icon: "Settings", labelKey: "admin.settings" },
] as const;

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <AdminSessionProvider>
      <AdminGuard>
        <div className="min-h-screen bg-muted/20 flex flex-col">
          <AdminTopbar />
          <div className="flex flex-1">
            <aside className="hidden md:flex md:w-64 lg:w-72 xl:w-80 flex-col border-r border-border bg-background/95 backdrop-blur-unified-lg">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('admin.back_to_editor')}
              </Link>
              <div className="p-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.title')}</h2>
              </div>
              <nav className="flex-1 space-y-1 px-3 pb-4">
                {navItems.map((item) => {
                  const Icon = Icons[item.icon];
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          "hover:bg-primary/10 text-muted-foreground hover:text-foreground",
                          (isActive || active) && "bg-primary/15 text-primary"
                        )
                      }
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      {t(item.labelKey)}
                    </NavLink>
                  );
                })}
              </nav>
            </aside>
            <main className="flex-1 min-w-0">
              <div className="mx-auto w-full max-w-6xl px-4 py-8">
                <Outlet />
              </div>
            </main>
          </div>
          <Footer />
        </div>
      </AdminGuard>
    </AdminSessionProvider>
  );
};

export default AdminLayout;

