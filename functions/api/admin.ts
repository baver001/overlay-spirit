import { nanoid } from 'nanoid'
import { z } from 'zod'

export interface Env {
  DB: D1Database;
  R2?: R2Bucket;
}

const JSON_HEADERS = { 'content-type': 'application/json' } as const;
const MAX_PAGE_SIZE = 100;

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: JSON_HEADERS,
    ...init,
  });
}

function badRequest(message: string, issues?: unknown) {
  return json({ error: message, issues }, { status: 400 });
}

async function handleAction(ctx: EventContext<Env, any, any>, fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('[admin] unexpected error', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

const categoryPayloadSchema = z.object({
  slug: z.string().trim().min(1, 'slug is required'),
  name: z.string().trim().min(1, 'name is required'),
  order_index: z.number().int().min(0).optional(),
});

const categoryDeleteSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

const setBaseSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  category_id: z.union([z.string().trim().min(1), z.null()]).optional(),
  description: z.union([z.string().trim().max(4000), z.null()]).optional(),
  cover_image_url: z.union([z.string().trim().max(2048), z.null()]).optional(),
  cover_key: z.union([z.string().trim().max(512), z.null()]).optional(),
  is_paid: z.boolean().optional(),
  price_cents: z.number().int().min(0).optional(),
  stripe_product_id: z.union([z.string().trim().max(255), z.null()]).optional(),
  stripe_price_id: z.union([z.string().trim().max(255), z.null()]).optional(),
  is_active: z.boolean().optional(),
});

const setCreateSchema = setBaseSchema.superRefine((data, ctx) => {
  if (data.is_paid && (data.price_cents === undefined || data.price_cents === null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price_cents'], message: 'price_cents is required for paid sets' });
  }
});

const setUpdateSchema = setBaseSchema
  .extend({ id: z.string().trim().min(1, 'id is required') })
  .superRefine((data, ctx) => {
    if (data.is_paid && (data.price_cents === undefined || data.price_cents === null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price_cents'], message: 'price_cents is required for paid sets' });
    }
  });

const overlayBaseSchema = z.object({
  set_id: z.string().trim().min(1, 'set_id is required'),
  kind: z.enum(['css', 'image']),
  value: z.string().trim().min(1, 'value is required'),
  aspect_ratio: z.number().positive().max(1000).optional(),
  order_index: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

const overlayCreateSchema = overlayBaseSchema;

const overlayUpdateSchema = overlayBaseSchema.extend({
  id: z.string().trim().min(1, 'id is required'),
});

const deleteSchema = z.object({ id: z.string().trim().min(1, 'id is required') });

async function parseBody<T>(ctx: EventContext<Env, any, any>, schema: z.ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await ctx.request.json();
  } catch (error) {
    throw badRequest('Invalid JSON body');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest('Validation failed', parsed.error.flatten());
  }
  return parsed.data;
}

function toBool(value: boolean | undefined, fallback = false) {
  return value === undefined ? fallback : value;
}

function parseOptionalBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  if (!value) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(Math.floor(num), max);
}

function parseNonNegativeInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.floor(num);
}

async function requireAdmin(ctx: EventContext<Env, any, any>) {
  const cookie = ctx.request.headers.get('cookie') || '';
  const sid = cookie.match(/sid=([^;]+)/)?.[1];
  if (!sid) throw json({ error: 'Unauthorized' }, { status: 401 });
  const now = Date.now();
  const row = await ctx.env.DB
    .prepare(`SELECT u.id, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND (s.expires_at > ? AND s.revoked_at IS NULL)`)
    .bind(sid, now)
    .first<any>();
  if (!row || row.role !== 'admin') throw json({ error: 'Forbidden' }, { status: 403 });
  return row as { id: string };
}

export const onRequestPost: PagesFunction<Env> = async (ctx) =>
  handleAction(ctx, async () => {
    const admin = await requireAdmin(ctx);
    const url = new URL(ctx.request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'category.create':
        return categoryCreate(ctx);
      case 'category.update':
        return categoryUpdate(ctx);
      case 'category.delete':
        return categoryDelete(ctx);
      case 'set.create':
        return setCreate(ctx, admin.id);
      case 'set.update':
        return setUpdate(ctx);
      case 'set.delete':
        return setDelete(ctx);
      case 'overlay.create':
        return overlayCreate(ctx);
      case 'overlay.update':
        return overlayUpdate(ctx);
      case 'overlay.delete':
        return overlayDelete(ctx);
      case 'upload.put':
        return uploadPut(ctx, admin.id);
      default:
        return badRequest('Unknown action');
    }
  });

export const onRequestGet: PagesFunction<Env> = async (ctx) =>
  handleAction(ctx, async () => {
    await requireAdmin(ctx);
    const url = new URL(ctx.request.url);
    const list = url.searchParams.get('list');

    switch (list) {
      case 'categories':
        return listCategories(ctx, url);
      case 'sets':
        return listSets(ctx, url);
      case 'overlays':
        return listOverlays(ctx, url);
      case 'stats':
        return listStats(ctx);
      default:
        return badRequest('Unknown list');
    }
  });

async function listCategories(ctx: EventContext<Env, any, any>, url: URL) {
  const withCounts = parseOptionalBoolean(url.searchParams.get('with_counts')) ?? true;
  if (!withCounts) {
    const { results } = await ctx.env.DB
      .prepare(`SELECT * FROM categories ORDER BY order_index ASC, created_at ASC`)
      .all();
    return json({ items: results });
  }

  const { results } = await ctx.env.DB
    .prepare(`SELECT c.*, COUNT(s.id) AS sets_count
              FROM categories c
              LEFT JOIN overlay_sets s ON s.category_id = c.id
              GROUP BY c.id
              ORDER BY c.order_index ASC, c.created_at ASC`)
    .all();
  return json({ items: results });
}

async function listSets(ctx: EventContext<Env, any, any>, url: URL) {
  const limit = parsePositiveInt(url.searchParams.get('limit'), 50, MAX_PAGE_SIZE);
  const offset = parseNonNegativeInt(url.searchParams.get('offset'), 0);
  const binds: unknown[] = [];
  const where: string[] = [];

  const categoryId = url.searchParams.get('category_id');
  if (categoryId) {
    where.push('category_id = ?');
    binds.push(categoryId);
  }

  const isActive = parseOptionalBoolean(url.searchParams.get('is_active'));
  if (isActive !== undefined) {
    where.push('is_active = ?');
    binds.push(isActive ? 1 : 0);
  }

  const isPaid = parseOptionalBoolean(url.searchParams.get('is_paid'));
  if (isPaid !== undefined) {
    where.push('is_paid = ?');
    binds.push(isPaid ? 1 : 0);
  }

  const search = url.searchParams.get('search');
  if (search) {
    where.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)');
    const token = `%${search.toLowerCase()}%`;
    binds.push(token, token);
  }

  const baseQuery = `FROM overlay_sets${where.length ? ` WHERE ${where.join(' AND ')}` : ''}`;
  const dataQuery = `SELECT * ${baseQuery} ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) AS count ${baseQuery}`;

  const dataStmt = ctx.env.DB.prepare(dataQuery).bind(...binds, limit, offset);
  const countStmt = ctx.env.DB.prepare(countQuery).bind(...binds);

  const [{ results }, totalRow] = await Promise.all([
    dataStmt.all(),
    countStmt.first<{ count: number }>(),
  ]);

  return json({
    items: results,
    meta: {
      limit,
      offset,
      total: totalRow?.count ?? 0,
    },
  });
}

async function listOverlays(ctx: EventContext<Env, any, any>, url: URL) {
  const setId = url.searchParams.get('set_id');
  if (!setId) {
    throw badRequest('set_id is required');
  }
  const limit = parsePositiveInt(url.searchParams.get('limit'), 100, MAX_PAGE_SIZE);
  const offset = parseNonNegativeInt(url.searchParams.get('offset'), 0);
  const search = url.searchParams.get('search');

  const where: string[] = ['set_id = ?'];
  const binds: unknown[] = [setId];

  if (search) {
    where.push('(LOWER(value) LIKE ? OR LOWER(kind) LIKE ?)');
    const token = `%${search.toLowerCase()}%`;
    binds.push(token, token);
  }

  const baseQuery = `FROM overlays WHERE ${where.join(' AND ')}`;
  const dataQuery = `SELECT * ${baseQuery} ORDER BY order_index ASC, created_at ASC LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) AS count ${baseQuery}`;

  const dataStmt = ctx.env.DB.prepare(dataQuery).bind(...binds, limit, offset);
  const countStmt = ctx.env.DB.prepare(countQuery).bind(...binds);

  const [{ results }, totalRow] = await Promise.all([
    dataStmt.all(),
    countStmt.first<{ count: number }>(),
  ]);

  return json({
    items: results,
    meta: {
      limit,
      offset,
      total: totalRow?.count ?? 0,
    },
  });
}

async function listStats(ctx: EventContext<Env, any, any>) {
  const [categories, sets, overlays, purchases] = await Promise.all([
    ctx.env.DB.prepare('SELECT COUNT(*) AS count FROM categories').first<{ count: number }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count, SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) AS paid_count, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_count FROM overlay_sets').first<{
      count: number;
      paid_count: number | null;
      active_count: number | null;
    }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count FROM overlays').first<{ count: number }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count, SUM(price_cents) AS revenue_cents FROM purchases WHERE status = ?')
      .bind('paid')
      .first<{ count: number; revenue_cents: number | null }>(),
  ]);

  return json({
    stats: {
      categories: categories?.count ?? 0,
      sets: sets?.count ?? 0,
      paid_sets: sets?.paid_count ?? 0,
      active_sets: sets?.active_count ?? 0,
      overlays: overlays?.count ?? 0,
      total_purchases: purchases?.count ?? 0,
      revenue_cents: purchases?.revenue_cents ?? 0,
    },
  });
}

async function categoryCreate(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, categoryPayloadSchema);
  const id = nanoid();
  const now = Date.now();
  await ctx.env.DB
    .prepare(`INSERT INTO categories (id, slug, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, body.slug, body.name, body.order_index ?? 0, now, now)
    .run();
  return json({ id });
}

async function categoryUpdate(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, categoryPayloadSchema.merge(categoryDeleteSchema));
  const now = Date.now();
  await ctx.env.DB
    .prepare(`UPDATE categories SET slug = ?, name = ?, order_index = ?, updated_at = ? WHERE id = ?`)
    .bind(body.slug, body.name, body.order_index ?? 0, now, body.id)
    .run();
  return json({ ok: true });
}

async function categoryDelete(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, categoryDeleteSchema);
  await ctx.env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(body.id).run();
  return json({ ok: true });
}

async function setCreate(ctx: EventContext<Env, any, any>, createdBy: string) {
  const body = await parseBody(ctx, setCreateSchema);
  const id = nanoid();
  const now = Date.now();
  const isPaid = toBool(body.is_paid, false);
  const isActive = toBool(body.is_active, true);
  const price = isPaid ? body.price_cents ?? 0 : null;

  await ctx.env.DB
    .prepare(`INSERT INTO overlay_sets (id, title, category_id, description, cover_image_url, cover_key, is_paid, price_cents, stripe_product_id, stripe_price_id, is_active, created_by, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      body.title,
      body.category_id ?? null,
      body.description ?? null,
      body.cover_image_url ?? null,
      body.cover_key ?? null,
      isPaid ? 1 : 0,
      price,
      body.stripe_product_id ?? null,
      body.stripe_price_id ?? null,
      isActive ? 1 : 0,
      createdBy,
      now,
      now,
    )
    .run();

  return json({ id });
}

async function setUpdate(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, setUpdateSchema);
  const now = Date.now();
  const isPaid = toBool(body.is_paid, false);
  const isActive = toBool(body.is_active, true);
  const price = isPaid ? body.price_cents ?? 0 : null;

  await ctx.env.DB
    .prepare(`UPDATE overlay_sets SET title = ?, category_id = ?, description = ?, cover_image_url = ?, cover_key = ?, is_paid = ?, price_cents = ?, stripe_product_id = ?, stripe_price_id = ?, is_active = ?, updated_at = ? WHERE id = ?`)
    .bind(
      body.title,
      body.category_id ?? null,
      body.description ?? null,
      body.cover_image_url ?? null,
      body.cover_key ?? null,
      isPaid ? 1 : 0,
      price,
      body.stripe_product_id ?? null,
      body.stripe_price_id ?? null,
      isActive ? 1 : 0,
      now,
      body.id,
    )
    .run();

  return json({ ok: true });
}

async function setDelete(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, deleteSchema);
  await ctx.env.DB.prepare(`DELETE FROM overlay_sets WHERE id = ?`).bind(body.id).run();
  return json({ ok: true });
}

async function overlayCreate(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, overlayCreateSchema);
  const id = nanoid();
  const now = Date.now();

  await ctx.env.DB
    .prepare(`INSERT INTO overlays (id, set_id, kind, value, aspect_ratio, order_index, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      body.set_id,
      body.kind,
      body.value,
      body.aspect_ratio ?? null,
      body.order_index ?? 0,
      toBool(body.is_active, true) ? 1 : 0,
      now,
      now,
    )
    .run();

  return json({ id });
}

async function overlayUpdate(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, overlayUpdateSchema);
  const now = Date.now();

  await ctx.env.DB
    .prepare(`UPDATE overlays SET kind = ?, value = ?, aspect_ratio = ?, order_index = ?, is_active = ?, updated_at = ? WHERE id = ?`)
    .bind(
      body.kind,
      body.value,
      body.aspect_ratio ?? null,
      body.order_index ?? 0,
      toBool(body.is_active, true) ? 1 : 0,
      now,
      body.id,
    )
    .run();

  return json({ ok: true });
}

async function overlayDelete(ctx: EventContext<Env, any, any>) {
  const body = await parseBody(ctx, deleteSchema);
  await ctx.env.DB.prepare(`DELETE FROM overlays WHERE id = ?`).bind(body.id).run();
  return json({ ok: true });
}

async function uploadPut(ctx: EventContext<Env, any, any>, adminId: string) {
  if (!ctx.env.R2) return json({ error: 'R2 not configured' }, { status: 500 });
  const url = new URL(ctx.request.url);
  const keyPrefixRaw = url.searchParams.get('prefix') || 'overlays/';
  const keyPrefix = keyPrefixRaw.startsWith('/') ? keyPrefixRaw.slice(1) : keyPrefixRaw;

  const contentType = ctx.request.headers.get('content-type') || 'application/octet-stream';
  const sizeHeader = ctx.request.headers.get('content-length');
  const size = sizeHeader ? Number(sizeHeader) : undefined;
  if (size !== undefined && (!Number.isFinite(size) || size > 20 * 1024 * 1024)) {
    return badRequest('File too large (max 20MB)');
  }

  const key = `${keyPrefix}${crypto.randomUUID()}`;
  const body = await ctx.request.arrayBuffer();
  await ctx.env.R2.put(key, body, { httpMetadata: { contentType } });

  return json({ key, contentType, uploaded_by: adminId });
}


