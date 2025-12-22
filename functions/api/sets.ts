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

const MAX_LIMIT = 500;

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

// Helper to get current user from session
async function getCurrentUser(ctx: EventContext<Env, any, any>): Promise<{ id: string } | null> {
  const cookie = ctx.request.headers.get('cookie') || '';
  const match = cookie.match(/sid=([^;]+)/);
  if (!match) return null;
  const sessionId = decodeURIComponent(match[1]);
  const now = Date.now();
  const row = await ctx.env.DB
    .prepare(`SELECT user_id FROM sessions WHERE id = ? AND expires_at > ? AND revoked_at IS NULL`)
    .bind(sessionId, now)
    .first<{ user_id: string }>();
  return row ? { id: row.user_id } : null;
}

async function catalogResponse(ctx: EventContext<Env, any, any>) {
  const limit = parsePositiveInt(new URL(ctx.request.url).searchParams.get('limit'), 200, MAX_LIMIT);

  console.log('[catalog] Loading catalog with limit:', limit);

  // Get current user to check purchases
  const currentUser = await getCurrentUser(ctx);
  let purchasedSetIds: Set<string> = new Set();
  
  if (currentUser) {
    const purchases = await ctx.env.DB
      .prepare(`SELECT set_id FROM purchases WHERE user_id = ? AND status = 'paid'`)
      .bind(currentUser.id)
      .all<{ set_id: string }>();
    purchasedSetIds = new Set(purchases.results?.map(p => p.set_id) || []);
  }

  // Get categories with set counts
  const categories = await ctx.env.DB
    .prepare(`SELECT c.id, c.slug, c.name, c.order_index, COUNT(s.id) AS sets_count
              FROM categories c
              LEFT JOIN overlay_sets s ON s.category_id = c.id AND s.is_active = 1
              GROUP BY c.id
              ORDER BY c.order_index ASC, c.created_at ASC`)
    .all();

  // Get sets with their preview overlays
  const setsStmt = ctx.env.DB.prepare(`SELECT s.id, s.title, s.description, s.cover_image_url, s.is_paid, s.price_cents, s.discount_price_cents, s.updated_at, s.created_at, s.category_id
                                       FROM overlay_sets s
                                       WHERE s.is_active = 1
                                       ORDER BY s.updated_at DESC
                                       LIMIT ?`).bind(limit);

  const [{ results: rawSets }] = await Promise.all([setsStmt.all()]);

  console.log('[catalog] Found sets:', rawSets?.length || 0, rawSets?.map((s: any) => ({ id: s.id, title: s.title, category: s.category_id })));

  // Get ALL overlays for each set (not just preview)
  // Split into batches to avoid SQLite variable limit
  const setIds = rawSets.map((set: any) => set.id);
  let allOverlays: Record<string, any[]> = {};

  if (setIds.length > 0) {
    const BATCH_SIZE = 50; // D1 has a limit on SQL variables
    const batches: string[][] = [];
    
    for (let i = 0; i < setIds.length; i += BATCH_SIZE) {
      batches.push(setIds.slice(i, i + BATCH_SIZE));
    }

    console.log('[catalog] Loading overlays in', batches.length, 'batches');

    const batchResults = await Promise.all(
      batches.map(async (batchIds) => {
        const stmt = ctx.env.DB
          .prepare(`SELECT set_id, kind, value, aspect_ratio, order_index, is_active
                    FROM overlays
                    WHERE set_id IN (${batchIds.map(() => '?').join(',')})
                    AND is_active = 1
                    ORDER BY set_id, order_index ASC`)
          .bind(...batchIds);
        return stmt.all();
      })
    );

    // Merge all batch results
    const allResults = batchResults.flatMap(r => r.results || []);
    console.log('[catalog] Found overlays:', allResults.length);

    const overlaysBySet = allResults.reduce((acc: Record<string, any[]>, overlay: any) => {
      if (!acc[overlay.set_id]) acc[overlay.set_id] = [];
      acc[overlay.set_id].push({
        id: `${overlay.set_id}-${overlay.order_index}`,
        setId: overlay.set_id,
        kind: overlay.kind,
        value: overlay.value,
        orderIndex: overlay.order_index,
        isActive: overlay.is_active === 1,
        aspectRatio: overlay.aspect_ratio,
      });
      return acc;
    }, {});

    allOverlays = overlaysBySet;
  }

  const setsByCategory: Record<string, any[]> = {};

  rawSets.forEach((set: any) => {
    const grouping = set.category_id ?? 'uncategorized';
    if (!setsByCategory[grouping]) {
      setsByCategory[grouping] = [];
    }

    const setOverlays = allOverlays[String(set.id)] || [];
    const isPurchased = purchasedSetIds.has(set.id);
    const isPaid = set.is_paid === 1;
    
    console.log('[catalog] Set:', {
      id: set.id,
      title: set.title,
      category: set.category_id,
      overlaysCount: setOverlays.length,
      isPaid,
      isPurchased,
    });

    setsByCategory[grouping].push({
      id: set.id,
      title: set.title,
      description: set.description,
      coverImageUrl: set.cover_image_url,
      isPaid: isPaid,
      isPurchased: isPurchased,
      priceCents: set.price_cents,
      discountPriceCents: set.discount_price_cents,
      updatedAt: set.updated_at,
      createdAt: set.created_at,
      previewOverlays: setOverlays, // Now contains ALL overlays, not just first 3
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


