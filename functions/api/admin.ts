import { nanoid } from 'nanoid'
import { z } from 'zod'

export interface Env {
  DB: D1Database;
  R2?: R2Bucket;
}

const JSON_HEADERS = { 'content-type': 'application/json' } as const;
const MAX_PAGE_SIZE = 100;

function conflict(message: string) {
  return json({ error: message }, { status: 409 });
}

const settingsSchema = z.object({
  key: z.string().trim().min(1, 'key is required'),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]),
});

const settingsDeleteSchema = z.object({ key: z.string().trim().min(1, 'key is required') });

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || nanoid(8);
}

async function nextCategoryOrder(ctx: EventContext<Env, any, any>): Promise<number> {
  const row = await ctx.env.DB
    .prepare('SELECT COALESCE(MAX(order_index), -1) AS max_index FROM categories')
    .first<{ max_index: number }>();
  return Number(row?.max_index ?? -1) + 1;
}

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
    const detail = error instanceof Error ? error.message : String(error);
    return json({ error: 'Internal server error', detail }, { status: 500 });
  }
}

const categoryPayloadSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  order_index: z.number().int().min(0).optional(),
});

const categoriesReorderSchema = z.object({
  categories: z.array(z.object({ id: z.string().trim().min(1), order_index: z.number().int().min(0) })).min(1),
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
  price_cents: z.union([z.number().int().min(0), z.null()]).optional(),
  discount_price_cents: z.union([z.number().int().min(0), z.null()]).optional(),
  stripe_product_id: z.union([z.string().trim().max(255), z.null()]).optional(),
  stripe_price_id: z.union([z.string().trim().max(255), z.null()]).optional(),
  is_active: z.boolean().optional(),
  overlays: z
    .array(
      z.object({
        kind: z.enum(['css', 'image']),
        value: z.string().min(1, 'value is required'),
        aspect_ratio: z.number().positive().max(1000).optional(),
        order_index: z.number().int().min(0).optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .optional(),
});

const setCreateSchema = setBaseSchema.superRefine((data, ctx) => {
  // Remove price validation - we handle it in setCreate function
  if (data.overlays && data.overlays.length > 0) {
    data.overlays.forEach((overlay, index) => {
      if (overlay.kind === 'css') return;
      if (overlay.kind === 'image') {
        const val = overlay.value;
        // Allow http(s) URLs, R2 keys (overlays/), or simple filenames
        const isValid = val.startsWith('http://') || val.startsWith('https://') || val.startsWith('overlays/') || val.includes('/');
        if (!isValid && val.length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['overlays', index, 'value'],
            message: 'Image overlay value must be URL or R2 key',
          });
        }
      }
    });
  }
});

const setUpdateSchema = setBaseSchema
  .extend({ id: z.string().trim().min(1, 'id is required') })
  .superRefine((data, ctx) => {
    // Remove price validation - we handle it in setUpdate function
    if (data.overlays && data.overlays.length > 0) {
      data.overlays.forEach((overlay, index) => {
        if (overlay.kind === 'css') return;
        if (overlay.kind === 'image') {
          const val = overlay.value;
          // Allow http(s) URLs, R2 keys (overlays/), or simple filenames
          const isValid = val.startsWith('http://') || val.startsWith('https://') || val.startsWith('overlays/') || val.includes('/');
          if (!isValid && val.length < 3) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['overlays', index, 'value'],
              message: 'Image overlay value must be URL or R2 key',
            });
          }
        }
      });
    }
  });

const deleteSchema = z.object({ id: z.string().trim().min(1, 'id is required') });

const statsFilterSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
});

async function parseBody<T>(ctx: EventContext<Env, any, any>, schema: z.ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await ctx.request.json();
  } catch (error) {
    throw badRequest('Invalid JSON body');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const formattedErrors = parsed.error.flatten();
    console.error('[admin] Validation failed:', {
      endpoint: ctx.request.url,
      body: raw,
      errors: formattedErrors
    });
    throw badRequest('Validation failed', formattedErrors);
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
        return categoryCreate(ctx, admin.id);
      case 'category.update':
        return categoryUpdate(ctx, admin.id);
      case 'category.delete':
        return categoryDelete(ctx, admin.id);
      case 'set.create':
        return setCreate(ctx, admin.id);
      case 'set.update':
        return setUpdate(ctx, admin.id);
      case 'set.delete':
        return setDelete(ctx, admin.id);
      case 'settings.upsert':
        return settingsUpsert(ctx, admin.id);
      case 'settings.delete':
        return settingsDelete(ctx, admin.id);
      case 'category.reorder':
        return categoryReorder(ctx, admin.id);
      case 'file.upload':
        return fileUpload(ctx, admin.id);
      case 'set.get_overlays':
        return getSetOverlays(ctx, admin.id);
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
      case 'stats':
        return listStats(ctx, url);
      case 'settings':
        return listSettings(ctx);
      case 'dashboard':
        return listDashboard(ctx, url);
      case 'users':
        return listUsers(ctx, url);
      case 'purchases':
        return listPurchases(ctx, url);
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

async function listStats(ctx: EventContext<Env, any, any>, url: URL) {
  const params = statsFilterSchema.safeParse({ range: url.searchParams.get('range') ?? undefined });
  if (!params.success) {
    throw badRequest('Invalid stats params', params.error.flatten());
  }

  const range = params.data.range;
  const now = Date.now();
  const rangeMap: Record<typeof range, number> = {
    '7d': now - 7 * 24 * 60 * 60 * 1000,
    '30d': now - 30 * 24 * 60 * 60 * 1000,
    '90d': now - 90 * 24 * 60 * 60 * 1000,
    '365d': now - 365 * 24 * 60 * 60 * 1000,
  };
  const since = rangeMap[range];

  const [categories, sets, overlays, purchases, newUsers, activeCustomers] = await Promise.all([
    ctx.env.DB.prepare('SELECT COUNT(*) AS count FROM categories').first<{ count: number }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count, SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) AS paid_count, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_count FROM overlay_sets').first<{
      count: number;
      paid_count: number | null;
      active_count: number | null;
    }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count FROM overlays').first<{ count: number }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count, SUM(price_cents) AS revenue_cents FROM purchases WHERE status = ? AND created_at >= ?')
      .bind('paid', since)
      .first<{ count: number; revenue_cents: number | null }>(),
    ctx.env.DB.prepare('SELECT COUNT(*) AS count FROM users WHERE created_at >= ?').bind(since).first<{ count: number }>(),
    ctx.env.DB.prepare('SELECT COUNT(DISTINCT user_id) AS count FROM purchases WHERE status = ? AND created_at >= ?')
      .bind('paid', since)
      .first<{ count: number }>(),
  ]);

  return json({
    stats: {
      categories: categories?.count ?? 0,
      sets: sets?.count ?? 0,
      paid_sets: sets?.paid_count ?? 0,
      active_sets: sets?.active_count ?? 0,
      total_purchases: purchases?.count ?? 0,
      revenue_cents: purchases?.revenue_cents ?? 0,
      new_users: newUsers?.count ?? 0,
      active_customers: activeCustomers?.count ?? 0,
      range,
    },
  });
}

async function categoryCreate(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, categoryPayloadSchema);
  const id = nanoid();
  const now = Date.now();
  const orderIndex = body.order_index !== undefined ? body.order_index : await nextCategoryOrder(ctx);
  const slug = slugify(body.name);
  
  console.log('[admin] categoryCreate attempt', { id, slug, name: body.name, orderIndex });
  
  const existing = await ctx.env.DB.prepare(`SELECT 1 FROM categories WHERE slug = ?`).bind(slug).first();
  if (existing) {
    console.log('[admin] categoryCreate: slug already exists', { slug });
    return conflict('Category with the same name already exists');
  }
  
  const stmt = ctx.env.DB.prepare(`INSERT INTO categories (id, slug, name, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
  try {
    console.log('[admin] categoryCreate: inserting...', { id, slug, name: body.name, orderIndex, now });
    const result = await stmt.bind(id, slug, body.name, orderIndex, now, now).run();
    console.log('[admin] categoryCreate: insert success', { id, changes: result.meta.changes });
  } catch (error: any) {
    console.error('[admin] categoryCreate: insert failed', {
      error: error?.message || String(error),
      stack: error?.stack,
      id,
      slug,
      name: body.name,
      orderIndex,
    });
    if (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed: categories.slug')) {
      throw conflict('Category with the same name already exists');
    }
    throw error;
  }
  
  try {
    await logAudit(ctx, adminId, 'category.create', 'categories', id, body);
    console.log('[admin] categoryCreate: audit logged', { id });
  } catch (auditError: any) {
    console.error('[admin] categoryCreate: audit log failed', {
      error: auditError?.message || String(auditError),
      stack: auditError?.stack,
    });
    // Continue even if audit fails
  }
  
  return json({ id });
}

async function categoryUpdate(ctx: EventContext<Env, any, any>, adminId: string) {
  const base = categoryPayloadSchema.merge(categoryDeleteSchema).extend({ slug: z.string().trim().optional() });
  const body = await parseBody(ctx, base);
  const now = Date.now();
  const existingCategory = await ctx.env.DB
    .prepare(`SELECT order_index FROM categories WHERE id = ?`)
    .bind(body.id)
    .first<{ order_index: number }>();
  if (!existingCategory) {
    return badRequest('Category not found');
  }
  const orderIndex = body.order_index !== undefined ? body.order_index : existingCategory.order_index ?? 0;
  const slug = slugify(body.name);
  const existing = await ctx.env.DB
    .prepare(`SELECT id FROM categories WHERE slug = ? AND id != ?`)
    .bind(slug, body.id)
    .first();
  if (existing) {
    return conflict('Category with the same name already exists');
  }
  await ctx.env.DB
    .prepare(`UPDATE categories SET slug = ?, name = ?, order_index = ?, updated_at = ? WHERE id = ?`)
    .bind(slug, body.name, orderIndex, now, body.id)
    .run()
    .catch((error: any) => {
      if (typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed: categories.slug')) {
        throw conflict('Категория с таким slug уже существует');
      }
      console.error('[admin] category.update failed', error);
      throw error;
    });
  await logAudit(ctx, adminId, 'category.update', 'categories', body.id, body);
  return json({ ok: true });
}

async function categoryDelete(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, categoryDeleteSchema);
  try {
    console.log('[admin] categoryDelete: starting', { categoryId: body.id });
    
    // First, update overlay_sets to remove category references
    const updateResult = await ctx.env.DB
      .prepare(`UPDATE overlay_sets SET category_id = NULL WHERE category_id = ?`)
      .bind(body.id)
      .run();
    console.log('[admin] categoryDelete: updated overlay_sets', { categoryId: body.id, changes: updateResult.meta.changes });
    
    // Then delete the category
    const deleteResult = await ctx.env.DB
      .prepare(`DELETE FROM categories WHERE id = ?`)
      .bind(body.id)
      .run();
    console.log('[admin] categoryDelete: deleted category', { categoryId: body.id, changes: deleteResult.meta.changes });
    
    // Log audit - wrap in try/catch to prevent audit failure from breaking deletion
    try {
      await logAudit(ctx, adminId, 'category.delete', 'categories', body.id, null);
      console.log('[admin] categoryDelete: audit logged');
    } catch (auditError: any) {
      console.error('[admin] categoryDelete: audit log failed (non-critical)', {
        error: auditError?.message || String(auditError),
      });
      // Continue - don't fail the whole operation if audit fails
    }
    
    return json({ ok: true });
  } catch (error: any) {
    console.error('[admin] categoryDelete failed', {
      categoryId: body.id,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    throw error;
  }
}

async function categoryReorder(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, categoriesReorderSchema);
  const now = Date.now();
  const stmt = ctx.env.DB.prepare(`UPDATE categories SET order_index = ?, updated_at = ? WHERE id = ?`);
  for (const item of body.categories) {
    await stmt.bind(item.order_index, now, item.id).run();
  }
  await logAudit(ctx, adminId, 'category.reorder', 'categories', null, body.categories);
  return json({ ok: true });
}

async function setCreate(ctx: EventContext<Env, any, any>, createdBy: string) {
  const body = await parseBody(ctx, setCreateSchema);
  const id = nanoid();
  const now = Date.now();
  const isPaid = toBool(body.is_paid, false);
  const isActive = toBool(body.is_active, true);
  const price = isPaid ? body.price_cents ?? 0 : null;
  const discountPrice = isPaid && body.discount_price_cents ? body.discount_price_cents : null;

  await ctx.env.DB
    .prepare(`INSERT INTO overlay_sets (id, title, category_id, description, cover_image_url, cover_key, is_paid, price_cents, discount_price_cents, stripe_product_id, stripe_price_id, is_active, created_by, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      body.title,
      body.category_id ?? null,
      body.description ?? null,
      body.cover_image_url ?? null,
      body.cover_key ?? null,
      isPaid ? 1 : 0,
      price,
      discountPrice,
      body.stripe_product_id ?? null,
      body.stripe_price_id ?? null,
      isActive ? 1 : 0,
      createdBy,
      now,
      now,
    )
    .run();

  if (body.overlays && body.overlays.length) {
    console.log('[admin] Saving overlays for set:', { setId: id, count: body.overlays.length });
    const insertOverlay = ctx.env.DB.prepare(`INSERT INTO overlays (id, set_id, kind, value, aspect_ratio, order_index, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const overlay of body.overlays) {
      const overlayId = nanoid();
      console.log('[admin] Saving overlay:', { overlayId, setId: id, kind: overlay.kind, value: overlay.value });
      await insertOverlay
        .bind(
          overlayId,
          id,
          overlay.kind,
          overlay.value,
          overlay.aspect_ratio ?? null,
          overlay.order_index ?? 0,
          toBool(overlay.is_active, true) ? 1 : 0,
          now,
          now,
        )
        .run();
    }
  }

  await logAudit(ctx, createdBy, 'set.create', 'overlay_sets', id, body);
  return json({ id });
}

async function setUpdate(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, setUpdateSchema);
  const now = Date.now();
  const isPaid = toBool(body.is_paid, false);
  const isActive = toBool(body.is_active, true);
  const price = isPaid ? body.price_cents ?? 0 : null;
  const discountPrice = isPaid && body.discount_price_cents ? body.discount_price_cents : null;

  await ctx.env.DB
    .prepare(`UPDATE overlay_sets SET title = ?, category_id = ?, description = ?, cover_image_url = ?, cover_key = ?, is_paid = ?, price_cents = ?, discount_price_cents = ?, stripe_product_id = ?, stripe_price_id = ?, is_active = ?, updated_at = ? WHERE id = ?`)
    .bind(
      body.title,
      body.category_id ?? null,
      body.description ?? null,
      body.cover_image_url ?? null,
      body.cover_key ?? null,
      isPaid ? 1 : 0,
      price,
      discountPrice,
      body.stripe_product_id ?? null,
      body.stripe_price_id ?? null,
      isActive ? 1 : 0,
      now,
      body.id,
    )
    .run();

  if (body.overlays) {
    await ctx.env.DB.prepare(`DELETE FROM overlays WHERE set_id = ?`).bind(body.id).run();
    if (body.overlays.length) {
      const insertOverlay = ctx.env.DB.prepare(`INSERT INTO overlays (id, set_id, kind, value, aspect_ratio, order_index, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const overlay of body.overlays) {
        const overlayId = nanoid();
        await insertOverlay
          .bind(
            overlayId,
            body.id,
            overlay.kind,
            overlay.value,
            overlay.aspect_ratio ?? null,
            overlay.order_index ?? 0,
            toBool(overlay.is_active, true) ? 1 : 0,
            now,
            now,
          )
          .run();
      }
    }
  }

  await logAudit(ctx, adminId, 'set.update', 'overlay_sets', body.id, body);

  return json({ ok: true });
}

async function setDelete(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, deleteSchema);

  try {
    console.log('[admin] setDelete: starting', { setId: body.id });

    // First, delete all overlays associated with this set
    const deleteOverlaysResult = await ctx.env.DB
      .prepare(`DELETE FROM overlays WHERE set_id = ?`)
      .bind(body.id)
      .run();
    console.log('[admin] setDelete: deleted overlays', { setId: body.id, changes: deleteOverlaysResult.meta.changes });

    // Then delete the set itself
    const deleteSetResult = await ctx.env.DB
      .prepare(`DELETE FROM overlay_sets WHERE id = ?`)
      .bind(body.id)
      .run();
    console.log('[admin] setDelete: deleted set', { setId: body.id, changes: deleteSetResult.meta.changes });

    // Log audit - wrap in try/catch to prevent audit failure from breaking deletion
    try {
      await logAudit(ctx, adminId, 'set.delete', 'overlay_sets', body.id, null);
      console.log('[admin] setDelete: audit logged');
    } catch (auditError: any) {
      console.error('[admin] setDelete: audit log failed (non-critical)', {
        error: auditError?.message || String(auditError),
      });
      // Continue - don't fail the whole operation if audit fails
    }

    return json({ ok: true });
  } catch (error: any) {
    console.error('[admin] setDelete failed', {
      setId: body.id,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    throw error;
  }
}

async function fileUpload(ctx: EventContext<Env, any, any>, adminId: string) {
  if (!ctx.env.R2) return json({ error: 'R2 not configured' }, { status: 500 });
  
  try {
    const formData = await ctx.request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return badRequest('No file provided');
    }
    
    // Validate file type (JPG only)
    if (!file.type.includes('image/jpeg') && !file.name.toLowerCase().endsWith('.jpg')) {
      return badRequest('Only JPG files are allowed');
    }
    
    // Validate file size (max 10MB per file)
    if (file.size > 10 * 1024 * 1024) {
      return badRequest('File too large (max 10MB)');
    }
    
    const key = `overlays/${nanoid()}.jpg`;
    const arrayBuffer = await file.arrayBuffer();
    
    await ctx.env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: 'image/jpeg',
      },
    });
    
    console.log('[admin] fileUpload success', { key, size: file.size, uploadedBy: adminId });
    
    return json({ key, contentType: 'image/jpeg', uploaded_by: adminId });
  } catch (error: any) {
    console.error('[admin] fileUpload failed', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

async function getSetOverlays(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, z.object({ set_id: z.string().trim().min(1) }));

  try {
    const { results } = await ctx.env.DB
      .prepare(`SELECT * FROM overlays WHERE set_id = ? ORDER BY order_index ASC`)
      .bind(body.set_id)
      .all();

    console.log('[admin] getSetOverlays:', { setId: body.set_id, count: results?.length ?? 0 });

    return json({ items: results || [] });
  } catch (error: any) {
    console.error('[admin] getSetOverlays failed:', {
      setId: body.set_id,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return json({ error: 'Failed to load overlays' }, { status: 500 });
  }
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

  const key = `${keyPrefix}${nanoid()}`;
  const body = await ctx.request.arrayBuffer();
  await ctx.env.R2.put(key, body, { httpMetadata: { contentType } });

  return json({ key, contentType, uploaded_by: adminId });
}

async function listSettings(ctx: EventContext<Env, any, any>) {
  try {
    const { results } = await ctx.env.DB.prepare(`SELECT key, value, updated_at, updated_by FROM app_settings ORDER BY key ASC`).all();
    console.log('[admin] listSettings success', { count: results?.length ?? 0 });
    return json({ items: results ?? [] });
  } catch (error: any) {
    console.error('[admin] listSettings failed', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    // Return empty array instead of throwing - settings page should work even if table is empty
    return json({ items: [] });
  }
}

async function settingsUpsert(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, settingsSchema);
  const jsonValue = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
  const now = Date.now();
  await ctx.env.DB
    .prepare(`INSERT INTO app_settings (key, value, updated_at, updated_by)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .bind(body.key, jsonValue, now, adminId)
    .run();
  await logAudit(ctx, adminId, 'settings.upsert', 'app_settings', body.key, body.value);
  return json({ ok: true });
}

async function settingsDelete(ctx: EventContext<Env, any, any>, adminId: string) {
  const body = await parseBody(ctx, settingsDeleteSchema);
  await ctx.env.DB.prepare(`DELETE FROM app_settings WHERE key = ?`).bind(body.key).run();
  await logAudit(ctx, adminId, 'settings.delete', 'app_settings', body.key, null);
  return json({ ok: true });
}

async function logAudit(ctx: EventContext<Env, any, any>, adminId: string, action: string, entity: string, entityId: string | null, meta: unknown) {
  const id = nanoid();
  const now = Date.now();
  try {
    await ctx.env.DB
      .prepare(`INSERT INTO admin_audit (id, admin_id, action, entity, entity_id, meta_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, adminId, action, entity, entityId, meta ? JSON.stringify(meta) : null, now)
      .run();
  } catch (error: any) {
    console.error('[admin] logAudit failed', {
      error: error?.message || String(error),
      stack: error?.stack,
      action,
      entity,
      entityId,
    });
    throw error;
  }
}

async function listDashboard(ctx: EventContext<Env, any, any>, url: URL) {
  const params = statsFilterSchema.safeParse({ range: url.searchParams.get('range') ?? undefined });
  if (!params.success) {
    throw badRequest('Invalid dashboard params', params.error.flatten());
  }
  const range = params.data.range;
  const now = Date.now();
  const sinceMap: Record<typeof range, number> = {
    '7d': now - 7 * 24 * 60 * 60 * 1000,
    '30d': now - 30 * 24 * 60 * 60 * 1000,
    '90d': now - 90 * 24 * 60 * 60 * 1000,
    '365d': now - 365 * 24 * 60 * 60 * 1000,
  };
  const since = sinceMap[range];

  const [purchasesByDay, revenueByDay, topSets, recentActivity] = await Promise.all([
    ctx.env.DB
      .prepare(`SELECT strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch')) AS day,
                       COUNT(*) AS count
                FROM purchases
                WHERE status = 'paid' AND created_at >= ?
                GROUP BY day
                ORDER BY day ASC`)
      .bind(since)
      .all()
      .catch((err) => {
        console.error('[admin] dashboard purchasesByDay', err);
        return { results: [] };
      }),
    ctx.env.DB
      .prepare(`SELECT strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch')) AS day,
                       SUM(price_cents) AS revenue_cents
                FROM purchases
                WHERE status = 'paid' AND created_at >= ?
                GROUP BY day
                ORDER BY day ASC`)
      .bind(since)
      .all()
      .catch((err) => {
        console.error('[admin] dashboard revenueByDay', err);
        return { results: [] };
      }),
    ctx.env.DB
      .prepare(`SELECT s.id, s.title, COUNT(p.id) AS sales_count, SUM(p.price_cents) AS revenue_cents
                FROM overlay_sets s
                LEFT JOIN purchases p ON p.set_id = s.id AND p.status = 'paid' AND p.created_at >= ?
                GROUP BY s.id
                ORDER BY COALESCE(revenue_cents, 0) DESC, sales_count DESC
                LIMIT 10`)
      .bind(since)
      .all()
      .catch((err) => {
        console.error('[admin] dashboard topSets', err);
        return { results: [] };
      }),
    ctx.env.DB
      .prepare(`SELECT a.id, a.action, a.entity, a.entity_id, a.created_at, u.email
                FROM admin_audit a
                LEFT JOIN users u ON u.id = a.admin_id
                ORDER BY a.created_at DESC
                LIMIT 20`)
      .all()
      .catch((err) => {
        console.error('[admin] dashboard activity', err);
        return { results: [] };
      }),
  ]);

  return json({
    range,
    since,
    purchasesByDay: purchasesByDay.results ?? [],
    revenueByDay: revenueByDay.results ?? [],
    topSets: topSets.results ?? [],
    recentActivity: recentActivity.results ?? [],
  });
}

async function listUsers(ctx: EventContext<Env, any, any>, url: URL) {
  const limit = parsePositiveInt(url.searchParams.get('limit'), 50, MAX_PAGE_SIZE);
  const offset = parseNonNegativeInt(url.searchParams.get('offset'), 0);
  const search = url.searchParams.get('search');
  const role = url.searchParams.get('role');

  const where: string[] = [];
  const binds: unknown[] = [];

  if (role) {
    where.push('role = ?');
    binds.push(role);
  }

  if (search) {
    where.push('(LOWER(email) LIKE ? )');
    const token = `%${search.toLowerCase()}%`;
    binds.push(token);
  }

  const base = `FROM users${where.length ? ` WHERE ${where.join(' AND ')}` : ''}`;
  const dataStmt = ctx.env.DB
    .prepare(`SELECT id, email, role, created_at, updated_at ${base} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...binds, limit, offset);
  const countStmt = ctx.env.DB
    .prepare(`SELECT COUNT(*) AS count ${base}`)
    .bind(...binds);

  const [{ results }, totalRow] = await Promise.all([dataStmt.all(), countStmt.first<{ count: number }>()]);

  return json({
    items: results,
    meta: {
      limit,
      offset,
      total: totalRow?.count ?? 0,
    },
  });
}

async function listPurchases(ctx: EventContext<Env, any, any>, url: URL) {
  const limit = parsePositiveInt(url.searchParams.get('limit'), 50, MAX_PAGE_SIZE);
  const offset = parseNonNegativeInt(url.searchParams.get('offset'), 0);
  const status = url.searchParams.get('status');
  const userId = url.searchParams.get('user_id');
  const setId = url.searchParams.get('set_id');

  const where: string[] = [];
  const binds: unknown[] = [];

  if (status) {
    where.push('status = ?');
    binds.push(status);
  }

  if (userId) {
    where.push('user_id = ?');
    binds.push(userId);
  }

  if (setId) {
    where.push('set_id = ?');
    binds.push(setId);
  }

  const base = `FROM purchases${where.length ? ` WHERE ${where.join(' AND ')}` : ''}`;
  const dataStmt = ctx.env.DB
    .prepare(`SELECT * ${base} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...binds, limit, offset);
  const countStmt = ctx.env.DB
    .prepare(`SELECT COUNT(*) AS count ${base}`)
    .bind(...binds);

  const [{ results }, totalRow] = await Promise.all([dataStmt.all(), countStmt.first<{ count: number }>()]);

  return json({
    items: results,
    meta: {
      limit,
      offset,
      total: totalRow?.count ?? 0,
    },
  });
}


