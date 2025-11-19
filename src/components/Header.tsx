import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';

declare global {
	interface Window {
		google?: any;
	}
}

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

	async function handleGoogleLogin() {
		setLoading(true);
		setError(null);
		try {
			// Load Google Sign-In script dynamically
			if (!window.google) {
				const script = document.createElement('script');
				script.src = 'https://accounts.google.com/gsi/client';
				script.async = true;
				script.defer = true;
				await new Promise((resolve, reject) => {
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}

			// Initialize Google Sign-In
			await new Promise<void>((resolve) => {
				window.google.accounts.id.initialize({
					client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
					callback: async (response: any) => {
						try {
							const res = await fetch('/api/auth?action=oauth-google', {
								method: 'POST',
								headers: { 'content-type': 'application/json' },
								credentials: 'include',
								body: JSON.stringify({ token: response.credential }),
							});
							if (!res.ok) throw new Error('Ошибка входа через Google');
							const me = await fetch('/api/auth', { credentials: 'include' }).then((r) => r.json());
							setUser(me.user || null);
							setOpen(false);
						} catch (e: any) {
							setError(e.message || 'Ошибка');
						} finally {
							setLoading(false);
							resolve();
						}
					},
				});
				window.google.accounts.id.prompt((notification: any) => {
					if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
						// Fallback to one-tap
						window.google.accounts.id.renderButton(
							document.createElement('div'),
							{ theme: 'outline', size: 'large', width: '100%' }
						);
					}
					resolve();
				});
			});
		} catch (e: any) {
			setError(e.message || 'Ошибка входа через Google');
			setLoading(false);
		}
	}

	async function handleAppleLogin() {
		setLoading(true);
		setError(null);
		try {
			// Apple Sign-In requires a button click, so we'll use a simplified approach
			// In production, you should use the official Apple Sign-In JS library
			alert('Apple Sign-In требует настройки на сервере. Пожалуйста, используйте email/password или Google для входа.');
			setLoading(false);
		} catch (e: any) {
			setError(e.message || 'Ошибка входа через Apple');
			setLoading(false);
		}
	}

	return (
		<header className="flex items-center p-4 border-b border-border fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-20">
			<a href="/" className="flex items-center gap-3">
				<img src="/assets/logo_white.svg" alt="Loverlay" className="h-7" />
			</a>
			<div className="ml-auto flex items-center gap-2">
				{user ? (
					<>
						<span className="text-sm text-muted-foreground hidden sm:inline-flex items-center gap-1">
							<UserCircle2 className="w-4 h-4" /> {user.email}
						</span>
						{user.role === 'admin' && (
							<a href="/admin" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border hover:bg-accent">
								Dashboard
							</a>
						)}
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
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
						<div className="relative bg-background rounded-lg shadow-2xl border w-[90vw] max-w-sm p-4 animate-fade-in-up">
							<h2 className="text-lg font-semibold mb-3">Вход</h2>
							<div className="space-y-3">
								{/* OAuth buttons */}
								<div className="space-y-2">
									<button
										onClick={handleGoogleLogin}
										disabled={loading}
										className="w-full px-3 py-2 rounded-md border bg-background hover:bg-accent flex items-center justify-center gap-2 disabled:opacity-50"
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24">
											<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
											<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
											<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
											<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
										</svg>
										Войти через Google
									</button>
									<button
										onClick={handleAppleLogin}
										disabled={loading}
										className="w-full px-3 py-2 rounded-md border bg-background hover:bg-accent flex items-center justify-center gap-2 disabled:opacity-50"
									>
										<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
											<path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
										</svg>
										Войти через Apple
									</button>
								</div>
								
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background px-2 text-muted-foreground">Или</span>
									</div>
								</div>

								{/* Email/Password form */}
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
						</div>
					</div>,
				document.body
				)
			)}
		</header>
	);
});

Header.displayName = 'Header';

export default Header;
