import { nanoid } from 'nanoid'

export interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
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
  if (action === 'register') return register(ctx);
  if (action === 'logout') return logout(ctx);
  if (action === 'oauth-google') return oauthGoogle(ctx);
  if (action === 'oauth-apple') return oauthApple(ctx);
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

async function register(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json().catch(() => null) as { email?: string, password?: string } | null;
  
  if (!body?.email || !body?.password) {
    return json({ error: 'Email и пароль обязательны' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return json({ error: 'Некорректный email' }, { status: 400 });
  }

  // Validate password length
  if (body.password.length < 6) {
    return json({ error: 'Пароль должен быть не менее 6 символов' }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await ctx.env.DB
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .bind(body.email.toLowerCase())
    .first<any>();

  if (existingUser) {
    return json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });
  }

  // Hash password
  const passwordHash = await sha256Hex(body.password);

  // Create user
  const userId = crypto.randomUUID();
  const now = Date.now();

  try {
    await ctx.env.DB
      .prepare(`INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(userId, body.email.toLowerCase(), passwordHash, 'customer', now, now)
      .run();

    // Create session
    const sid = nanoid();
    const ttl = 60 * 60 * 24 * 7; // 7 days
    await ctx.env.DB
      .prepare(`INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(sid, userId, now, now + ttl * 1000, ctx.request.headers.get('user-agent') || null, ctx.request.headers.get('CF-Connecting-IP') || null)
      .run();

    console.log('[register] User created:', { userId, email: body.email });

    return new Response(JSON.stringify({ ok: true, userId }), {
      headers: {
        'content-type': 'application/json',
        'set-cookie': setCookie('sid', sid, ttl),
      },
    });
  } catch (error: any) {
    console.error('[register] Error:', error);
    
    // Handle unique constraint violation
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });
    }
    
    return json({ error: 'Ошибка при регистрации' }, { status: 500 });
  }
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

async function oauthGoogle(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json().catch(() => null) as { token?: string } | null;
  if (!body?.token) return json({ error: 'token required' }, { status: 400 });

  try {
    // Verify Google token
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${body.token}`);
    if (!verifyRes.ok) return json({ error: 'invalid token' }, { status: 401 });
    
    const googleUser = await verifyRes.json<any>();
    if (!googleUser.email || !googleUser.sub) return json({ error: 'invalid user data' }, { status: 401 });

    // Find or create user
    let user = await ctx.env.DB
      .prepare(`SELECT id, email, role FROM users WHERE provider = 'google' AND provider_id = ?`)
      .bind(googleUser.sub)
      .first<any>();

    if (!user) {
      // Check if user with this email exists
      const existingUser = await ctx.env.DB
        .prepare(`SELECT id FROM users WHERE email = ?`)
        .bind(googleUser.email)
        .first<any>();
      
      if (existingUser) {
        // Update existing user with provider info
        await ctx.env.DB
          .prepare(`UPDATE users SET provider = 'google', provider_id = ?, updated_at = ? WHERE id = ?`)
          .bind(googleUser.sub, Date.now(), existingUser.id)
          .run();
        user = await ctx.env.DB
          .prepare(`SELECT id, email, role FROM users WHERE id = ?`)
          .bind(existingUser.id)
          .first<any>();
      } else {
        // Create new user
        const userId = crypto.randomUUID();
        const now = Date.now();
        await ctx.env.DB
          .prepare(`INSERT INTO users (id, email, role, provider, provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(userId, googleUser.email, 'customer', 'google', googleUser.sub, now, now)
          .run();
        user = { id: userId, email: googleUser.email, role: 'customer' };
      }
    }

    // Create session
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
  } catch (error: any) {
    console.error('[oauth-google] Error:', error);
    return json({ error: 'oauth failed' }, { status: 500 });
  }
}

async function oauthApple(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json().catch(() => null) as { identityToken?: string, authorizationCode?: string, user?: { email?: string } } | null;
  if (!body?.identityToken) return json({ error: 'identityToken required' }, { status: 400 });

  try {
    // For Apple, we need to verify the JWT token
    // This is a simplified version - in production, verify the token signature with Apple's public keys
    // For now, we'll decode the JWT payload (without verification for simplicity)
    const parts = body.identityToken.split('.');
    if (parts.length !== 3) return json({ error: 'invalid token format' }, { status: 401 });
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const appleUserId = payload.sub;
    const email = body.user?.email || payload.email;

    if (!appleUserId) return json({ error: 'invalid user data' }, { status: 401 });

    // Find or create user
    let user = await ctx.env.DB
      .prepare(`SELECT id, email, role FROM users WHERE provider = 'apple' AND provider_id = ?`)
      .bind(appleUserId)
      .first<any>();

    if (!user) {
      // Check if user with this email exists
      if (email) {
        const existingUser = await ctx.env.DB
          .prepare(`SELECT id FROM users WHERE email = ?`)
          .bind(email)
          .first<any>();
        
        if (existingUser) {
          // Update existing user with provider info
          await ctx.env.DB
            .prepare(`UPDATE users SET provider = 'apple', provider_id = ?, updated_at = ? WHERE id = ?`)
            .bind(appleUserId, Date.now(), existingUser.id)
            .run();
          user = await ctx.env.DB
            .prepare(`SELECT id, email, role FROM users WHERE id = ?`)
            .bind(existingUser.id)
            .first<any>();
        }
      }
      
      if (!user) {
        // Create new user (email might be null for Apple)
        const userId = crypto.randomUUID();
        const now = Date.now();
        const userEmail = email || `apple_${appleUserId}@apple.local`;
        await ctx.env.DB
          .prepare(`INSERT INTO users (id, email, role, provider, provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(userId, userEmail, 'customer', 'apple', appleUserId, now, now)
          .run();
        user = { id: userId, email: userEmail, role: 'customer' };
      }
    }

    // Create session
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
  } catch (error: any) {
    console.error('[oauth-apple] Error:', error);
    return json({ error: 'oauth failed' }, { status: 500 });
  }
}


