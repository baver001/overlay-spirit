import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, BookOpen, Boxes, Home, Layers3 } from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Обзор', icon: Home, end: true },
  { to: '/admin/categories', label: 'Рубрики', icon: Layers3 },
  { to: '/admin/sets', label: 'Наборы', icon: Boxes },
  { to: '/admin/overlays', label: 'Оверлеи', icon: BookOpen },
  { to: '/admin/stats', label: 'Статистика', icon: BarChart3 },
];

const AdminLayout: React.FC = () => {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-6 px-4 pb-16 pt-10 lg:flex-row">
      <aside className="flex h-max flex-col gap-2 rounded-xl border border-border bg-background/80 p-4 lg:w-64">
        <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-muted-foreground">Админ-панель</h2>
        <nav className="mt-4 flex flex-col gap-1">
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 rounded-xl border border-border bg-background/70 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
