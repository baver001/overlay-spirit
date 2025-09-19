import { nanoid } from 'nanoid'

export interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function getCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, maxAgeSeconds: number): string {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    // Secure автоматически на Pages prod
    `Max-Age=${maxAgeSeconds}`,
  ];
  return attrs.join('; ');
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const action = url.searchParams.get('action');
  if (action === 'login') return login(ctx);
  if (action === 'logout') return logout(ctx);
  return json({ error: 'Unsupported action' }, { status: 400 });
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const sessionId = getCookie(ctx.request, 'sid');
  if (!sessionId) return json({ user: null });
  const now = Date.now();
  const row = await ctx.env.DB
    .prepare(`SELECT s.id, s.user_id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND (s.expires_at > ? AND s.revoked_at IS NULL)`)
    .bind(sessionId, now)
    .first();
  if (!row) return json({ user: null });
  return json({ user: { id: row.user_id, email: row.email, role: row.role } });
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function login(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json().catch(() => null) as { email?: string, password?: string } | null;
  if (!body?.email || !body?.password) return json({ error: 'email/password required' }, { status: 400 });

  const user = await ctx.env.DB.prepare(`SELECT id, email, role, password_hash FROM users WHERE email = ?`).bind(body.email).first<any>();
  if (!user) return json({ error: 'invalid credentials' }, { status: 401 });

  // Проверяем пароль как SHA-256 hex
  const incomingHash = await sha256Hex(body.password);
  if (user.password_hash && user.password_hash !== incomingHash) {
    return json({ error: 'invalid credentials' }, { status: 401 });
  }

  const sid = nanoid();
  const now = Date.now();
  const ttl = 60 * 60 * 24 * 7; // 7d
  await ctx.env.DB.prepare(`INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(sid, user.id, now, now + ttl * 1000, ctx.request.headers.get('user-agent') || null, ctx.request.headers.get('CF-Connecting-IP') || null)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'content-type': 'application/json',
      'set-cookie': setCookie('sid', sid, ttl),
    },
  });
}

async function logout(ctx: EventContext<Env, any, any>) {
  const sid = getCookie(ctx.request, 'sid');
  if (sid) {
    await ctx.env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`).bind(Date.now(), sid).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'content-type': 'application/json',
      'set-cookie': setCookie('sid', '', 0),
    },
  });
}


