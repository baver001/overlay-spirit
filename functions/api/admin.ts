import { nanoid } from 'nanoid'

export interface Env {
  DB: D1Database;
  R2?: R2Bucket;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

async function requireAdmin(ctx: EventContext<Env, any, any>) {
  const cookie = ctx.request.headers.get('cookie') || '';
  const sid = cookie.match(/sid=([^;]+)/)?.[1];
  if (!sid) throw new Response('Unauthorized', { status: 401 });
  const now = Date.now();
  const row = await ctx.env.DB
    .prepare(`SELECT u.id, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND (s.expires_at > ? AND s.revoked_at IS NULL)`)
    .bind(sid, now)
    .first();
  if (!row || row.role !== 'admin') throw new Response('Forbidden', { status: 403 });
  return row as { id: string };
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const admin = await requireAdmin(ctx);
  const url = new URL(ctx.request.url);
  const path = url.searchParams.get('action');

  if (path === 'category.create') return categoryCreate(ctx);
  if (path === 'category.update') return categoryUpdate(ctx);
  if (path === 'category.delete') return categoryDelete(ctx);
  if (path === 'set.create') return setCreate(ctx, admin.id);
  if (path === 'set.update') return setUpdate(ctx);
  if (path === 'set.delete') return setDelete(ctx);
  if (path === 'overlay.create') return overlayCreate(ctx);
  if (path === 'overlay.update') return overlayUpdate(ctx);
  if (path === 'overlay.delete') return overlayDelete(ctx);
  if (path === 'upload.put') return uploadPut(ctx);
  return json({ error: 'Unknown action' }, { status: 400 });
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  await requireAdmin(ctx);
  const url = new URL(ctx.request.url);
  const list = url.searchParams.get('list');
  if (list === 'categories') {
    const { results } = await ctx.env.DB.prepare(`SELECT * FROM categories ORDER BY order_index ASC, created_at ASC`).all();
    return json({ items: results });
  }
  if (list === 'sets') {
    const { results } = await ctx.env.DB.prepare(`SELECT * FROM overlay_sets ORDER BY created_at DESC`).all();
    return json({ items: results });
  }
  if (list === 'overlays') {
    const setId = url.searchParams.get('set_id') || '';
    const { results } = await ctx.env.DB.prepare(`SELECT * FROM overlays WHERE set_id = ? ORDER BY order_index ASC`).bind(setId).all();
    return json({ items: results });
  }
  return json({ error: 'Unknown list' }, { status: 400 });
};

async function categoryCreate(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json();
  const id = nanoid();
  const now = Date.now();
  await ctx.env.DB.prepare(`INSERT INTO categories (id, slug, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, body.slug, body.name, body.order_index ?? 0, now, now)
    .run();
  return json({ id });
}
async function categoryUpdate(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json();
  const now = Date.now();
  await ctx.env.DB.prepare(`UPDATE categories SET slug = ?, name = ?, order_index = ?, updated_at = ? WHERE id = ?`)
    .bind(body.slug, body.name, body.order_index ?? 0, now, body.id)
    .run();
  return json({ ok: true });
}
async function categoryDelete(ctx: EventContext<Env, any, any>) {
  const body = await ctx.request.json();
  await ctx.env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(body.id).run();
  return json({ ok: true });
}

async function setCreate(ctx: EventContext<Env, any, any>, createdBy: string) {
  const b = await ctx.request.json();
  const id = nanoid();
  const now = Date.now();
  await ctx.env.DB.prepare(`INSERT INTO overlay_sets (id, title, category_id, description, cover_image_url, cover_key, is_paid, price_cents, stripe_product_id, stripe_price_id, is_active, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, b.title, b.category_id ?? null, b.description ?? null, b.cover_image_url ?? null, b.cover_key ?? null, b.is_paid ? 1 : 0, b.price_cents ?? null, b.stripe_product_id ?? null, b.stripe_price_id ?? null, 1, createdBy, now, now)
    .run();
  return json({ id });
}
async function setUpdate(ctx: EventContext<Env, any, any>) {
  const b = await ctx.request.json();
  const now = Date.now();
  await ctx.env.DB.prepare(`UPDATE overlay_sets SET title = ?, category_id = ?, description = ?, cover_image_url = ?, cover_key = ?, is_paid = ?, price_cents = ?, stripe_product_id = ?, stripe_price_id = ?, is_active = ?, updated_at = ? WHERE id = ?`)
    .bind(b.title, b.category_id ?? null, b.description ?? null, b.cover_image_url ?? null, b.cover_key ?? null, b.is_paid ? 1 : 0, b.price_cents ?? null, b.stripe_product_id ?? null, b.stripe_price_id ?? null, b.is_active ? 1 : 0, now, b.id)
    .run();
  return json({ ok: true });
}
async function setDelete(ctx: EventContext<Env, any, any>) {
  const b = await ctx.request.json();
  await ctx.env.DB.prepare(`DELETE FROM overlay_sets WHERE id = ?`).bind(b.id).run();
  return json({ ok: true });
}

async function overlayCreate(ctx: EventContext<Env, any, any>) {
  const b = await ctx.request.json();
  const id = nanoid();
  const now = Date.now();
  await ctx.env.DB.prepare(`INSERT INTO overlays (id, set_id, kind, value, aspect_ratio, order_index, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`)
    .bind(id, b.set_id, b.kind, b.value, b.aspect_ratio ?? null, b.order_index ?? 0, now, now)
    .run();
  return json({ id });
}
async function overlayUpdate(ctx: EventContext<Env, any, any>) {
  const b = await ctx.request.json();
  const now = Date.now();
  await ctx.env.DB.prepare(`UPDATE overlays SET kind = ?, value = ?, aspect_ratio = ?, order_index = ?, is_active = ?, updated_at = ? WHERE id = ?`)
    .bind(b.kind, b.value, b.aspect_ratio ?? null, b.order_index ?? 0, b.is_active ? 1 : 0, now, b.id)
    .run();
  return json({ ok: true });
}
async function overlayDelete(ctx: EventContext<Env, any, any>) {
  const b = await ctx.request.json();
  await ctx.env.DB.prepare(`DELETE FROM overlays WHERE id = ?`).bind(b.id).run();
  return json({ ok: true });
}

// Upload binary to R2, return key
async function uploadPut(ctx: EventContext<Env, any, any>) {
  if (!ctx.env.R2) return json({ error: 'R2 not configured' }, { status: 500 });
  const url = new URL(ctx.request.url);
  const keyPrefix = url.searchParams.get('prefix') || 'overlays/';
  const contentType = ctx.request.headers.get('content-type') || 'application/octet-stream';
  const key = `${keyPrefix}${crypto.randomUUID()}`;
  const body = await ctx.request.arrayBuffer();
  await ctx.env.R2.put(key, body, { httpMetadata: { contentType } });
  return json({ key });
}


