import React, { useEffect, useState } from 'react';
import { Camera, LogIn, LogOut, UserCircle2 } from 'lucide-react';

interface UserInfo {
	id: string;
	email: string;
	role: 'admin' | 'customer';
}

const Header: React.FC = React.memo(() => {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch('/api/auth', { credentials: 'include' })
			.then((r) => r.json())
			.then((d) => setUser(d.user || null))
			.catch(() => {});
	}, []);

	async function handleLogin() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/auth?action=login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			});
			if (!res.ok) throw new Error('Ошибка входа');
			const me = await fetch('/api/auth', { credentials: 'include' }).then((r) => r.json());
			setUser(me.user || null);
			setOpen(false);
		} catch (e: any) {
			setError(e.message || 'Ошибка');
		} finally {
			setLoading(false);
		}
	}

	async function handleLogout() {
		await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'include' });
		setUser(null);
	}

	return (
		<header className="flex items-center p-4 border-b border-border fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-20">
			<Camera className="w-6 h-6 mr-3 text-primary" />
			<h1 className="text-xl font-bold text-foreground">Photo Editor</h1>
			<div className="ml-auto flex items-center gap-2">
				{user ? (
					<>
						<span className="text-sm text-muted-foreground hidden sm:inline-flex items-center gap-1">
							<UserCircle2 className="w-4 h-4" /> {user.email}
						</span>
						<button onClick={handleLogout} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border hover:bg-accent">
							<LogOut className="w-4 h-4" /> Выйти
						</button>
					</>
				) : (
					<button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border hover:bg-accent">
						<LogIn className="w-4 h-4" /> Войти
					</button>
				)}
			</div>

			{open && !user && (
				<div className="fixed inset-0 z-30 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
					<div className="relative bg-background rounded-lg shadow-xl border w-[90vw] max-w-sm p-4 animate-fade-in-up">
						<h2 className="text-lg font-semibold mb-3">Вход</h2>
						<div className="space-y-2">
							<input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full px-3 py-2 rounded-md border bg-background"
							/>
							<input
								type="password"
								placeholder="Пароль"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-3 py-2 rounded-md border bg-background"
							/>
							{error && <div className="text-red-500 text-sm">{error}</div>}
							<div className="flex justify-end gap-2 pt-2">
								<button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-md text-sm border">Отмена</button>
								<button onClick={handleLogin} disabled={loading} className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground disabled:opacity-50">
									{loading ? '...' : 'Войти'}
								</button>
							</div>
						</div>
					</div>
				)}
		</header>
	);
});

Header.displayName = 'Header';

export default Header;
