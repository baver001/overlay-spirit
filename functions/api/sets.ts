export interface Env {
  DB: D1Database;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function parseBoolean(value: string | null): boolean | undefined {
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

const MAX_LIMIT = 100;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const catalogRequested = url.searchParams.get('catalog') === '1';

  if (catalogRequested) {
    return catalogResponse(ctx);
  }

  const categoryId = url.searchParams.get('category_id');
  const paid = url.searchParams.get('paid');

  let sql = `SELECT s.* FROM overlay_sets s WHERE s.is_active = 1`;
  const binds: any[] = [];
  if (categoryId) {
    sql += ` AND s.category_id = ?`;
    binds.push(categoryId);
  }
  if (paid === '0') {
    sql += ` AND s.is_paid = 0`;
  }
  if (paid === '1') {
    sql += ` AND s.is_paid = 1`;
  }
  sql += ` ORDER BY s.created_at DESC`;

  const { results: sets } = await ctx.env.DB.prepare(sql).bind(...binds).all();
  return json({ items: sets });
};

async function catalogResponse(ctx: EventContext<Env, any, any>) {
  const limit = parsePositiveInt(new URL(ctx.request.url).searchParams.get('limit'), 50, MAX_LIMIT);
  const categories = await ctx.env.DB
    .prepare(`SELECT c.id, c.slug, c.name, c.order_index, COUNT(s.id) AS sets_count
              FROM categories c
              LEFT JOIN overlay_sets s ON s.category_id = c.id AND s.is_active = 1
              GROUP BY c.id
              ORDER BY c.order_index ASC, c.created_at ASC`)
    .all();

  const setsStmt = ctx.env.DB.prepare(`SELECT s.id, s.title, s.description, s.cover_image_url, s.is_paid, s.price_cents, s.updated_at, s.created_at, s.category_id
                                       FROM overlay_sets s
                                       WHERE s.is_active = 1
                                       ORDER BY s.updated_at DESC
                                       LIMIT ?`).bind(limit);

  const overlaysStmt = ctx.env.DB.prepare(`SELECT o.id, o.set_id, o.kind, o.value, o.order_index, o.is_active
                                           FROM overlays o
                                           WHERE o.is_active = 1
                                           ORDER BY o.set_id ASC, o.order_index ASC`);

  const [{ results: rawSets }, { results: rawOverlays }] = await Promise.all([setsStmt.all(), overlaysStmt.all()]);

  const setsByCategory: Record<string, any[]> = {};
  const overlaysBySet = rawOverlays.reduce<Record<string, any[]>>((acc, row: any) => {
    if (!acc[row.set_id]) acc[row.set_id] = [];
    acc[row.set_id].push({
      id: row.id,
      setId: row.set_id,
      kind: row.kind,
      value: row.value,
      orderIndex: row.order_index,
      isActive: row.is_active === 1,
    });
    return acc;
  }, {});

  rawSets.forEach((set: any) => {
    const grouping = set.category_id ?? 'uncategorized';
    if (!setsByCategory[grouping]) {
      setsByCategory[grouping] = [];
    }
    setsByCategory[grouping].push({
      id: set.id,
      title: set.title,
      description: set.description,
      coverImageUrl: set.cover_image_url,
      isPaid: set.is_paid === 1,
      priceCents: set.price_cents,
      updatedAt: set.updated_at,
      createdAt: set.created_at,
      previewOverlays: (overlaysBySet[set.id] ?? []).slice(0, 6),
    });
  });

  return json({
    categories: categories.results ?? [],
    setsByCategory,
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const body = await ctx.request.json().catch(() => ({}));
  if (body.action === 'get_overlays') {
    const { results } = await ctx.env.DB
      .prepare(`SELECT * FROM overlays WHERE set_id = ? AND is_active = 1 ORDER BY order_index ASC`)
      .bind(body.set_id)
      .all();
    return json({ items: results });
  }
  if (body.action === 'filter_sets') {
    return filterSets(ctx, body);
  }
  return json({ error: 'Unknown action' }, { status: 400 });
};

async function filterSets(ctx: EventContext<Env, any, any>, body: any) {
  const limit = Math.min(body.limit ?? 50, MAX_LIMIT);
  const offset = Math.max(body.offset ?? 0, 0);
  const where: string[] = ['s.is_active = 1'];
  const binds: any[] = [];

  if (body.category_id) {
    where.push('s.category_id = ?');
    binds.push(body.category_id);
  }

  const isPaid = parseBoolean(body.is_paid ?? null);
  if (isPaid !== undefined) {
    where.push('s.is_paid = ?');
    binds.push(isPaid ? 1 : 0);
  }

  if (body.search) {
    where.push('(LOWER(s.title) LIKE ? OR LOWER(s.description) LIKE ?)');
    const token = `%${body.search.toLowerCase()}%`;
    binds.push(token, token);
  }

  const base = `FROM overlay_sets s${where.length ? ` WHERE ${where.join(' AND ')}` : ''}`;
  const dataStmt = ctx.env.DB
    .prepare(`SELECT s.* ${base} ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`)
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


