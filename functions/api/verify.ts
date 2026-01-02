import { jwtVerify } from 'jose';

export interface Env {
  DB: D1Database;
  SUPABASE_JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
}

export async function verifySupabaseToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload;
}

export async function syncUser(ctx: { env: Env }, token: string) {
  const secret = ctx.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error('SUPABASE_JWT_SECRET is missing');
    throw new Error('Server configuration error: SUPABASE_JWT_SECRET is missing');
  }

  const payload = await verifySupabaseToken(token, secret);
  const email = payload.email as string;
  const supabaseUserId = payload.sub as string;
  
  // Determine role: check env ADMIN_EMAIL first, then fallback to JWT metadata
  const adminEmail = ctx.env.ADMIN_EMAIL;
  let role = (payload.app_metadata?.role as string) || (payload.user_metadata?.role as string) || 'customer';
  
  if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
    role = 'admin';
  }

  // Check if user exists in D1 and sync if needed
  // 1. Try to find by primary ID OR provider_id
  let d1User = await ctx.env.DB.prepare('SELECT id, role FROM users WHERE id = ? OR provider_id = ?')
    .bind(supabaseUserId, supabaseUserId)
    .first<{ id: string, role: string }>();

  if (!d1User) {
    // Check by email for migration from old system
    const existingByEmail = await ctx.env.DB.prepare('SELECT id, role FROM users WHERE email = ?').bind(email).first<{ id: string, role: string }>();

    if (existingByEmail) {
      // Link existing user to Supabase ID via provider_id
      console.log(`Linking user ${email} (ID: ${existingByEmail.id}) to Supabase ID ${supabaseUserId}`);
      await ctx.env.DB.prepare('UPDATE users SET provider_id = ?, provider = ?, updated_at = ? WHERE id = ?')
        .bind(supabaseUserId, 'supabase', Date.now(), existingByEmail.id)
        .run();
      d1User = { id: existingByEmail.id, role: existingByEmail.role };
    } else {
      // Create new user in D1, using Supabase ID as primary ID
      console.log(`Creating new D1 user for ${email} (${supabaseUserId}) with role ${role}`);
      await ctx.env.DB.prepare('INSERT INTO users (id, email, role, provider, provider_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(supabaseUserId, email, role, 'supabase', supabaseUserId, Date.now(), Date.now())
        .run();
      d1User = { id: supabaseUserId, role };
    }
  } else {
    // Update email or role if changed
    if (d1User.role !== role) {
      console.log(`Updating role for user ${email}: ${d1User.role} -> ${role}`);
      await ctx.env.DB.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
        .bind(role, Date.now(), d1User.id)
        .run();
    }
  }

  return { id: d1User.id, email, role };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });
  }

  try {
    const user = await syncUser(ctx, authHeader.split(' ')[1]);
    return new Response(JSON.stringify({ ok: true, user }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Verify failed:', e);
    return new Response(JSON.stringify({ error: 'Auth failed', detail: e.message }), { status: 401 });
  }
};
