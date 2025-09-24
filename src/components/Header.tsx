import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Camera, LogIn, LogOut, Menu, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/providers/AuthProvider';

const NAV_ITEMS = [
  { to: '/', label: 'Главная', end: true },
  { to: '/editor', label: 'Редактор' },
];

const Header: React.FC = () => {
  const { user, status, login, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const extendedNav = useMemo(() => {
    const base = [...NAV_ITEMS];
    if (user) {
      base.push({ to: '/account', label: 'Кабинет' });
    }
    if (user?.role === 'admin') {
      base.push({ to: '/admin', label: 'Админ' });
    }
    return base;
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === '1') {
      setAuthOpen(true);
      params.delete('auth');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      setAuthOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = (
    <nav className="hidden items-center gap-4 md:flex">
      {extendedNav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `text-sm font-medium transition hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="px-4 py-3 text-left">
                <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                  <Camera className="h-5 w-5 text-primary" /> Loverlay
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                {extendedNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <Camera className="h-5 w-5 text-primary" />
            Loverlay
          </Link>
        </div>

        <div className="ml-6 flex-1">{navLinks}</div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-sm text-muted-foreground sm:flex sm:items-center sm:gap-2">
                <UserCircle2 className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Выйти
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" onClick={() => setAuthOpen(true)} disabled={status === 'loading'}>
              <LogIn className="mr-2 h-4 w-4" /> Войти
            </Button>
          )}
        </div>
      </div>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход в аккаунт</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Входим…' : 'Продолжить'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Демо-учётные записи: <br /> admin@loverlay.app / admin123 и user@loverlay.app / user123
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default React.memo(Header);
