export interface Env {
  DB: D1Database;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const categoryId = url.searchParams.get('category_id');
  const paid = url.searchParams.get('paid');

  let sql = `SELECT s.* FROM overlay_sets s WHERE s.is_active = 1`;
  const binds: any[] = [];
  if (categoryId) { sql += ` AND s.category_id = ?`; binds.push(categoryId); }
  if (paid === '0') { sql += ` AND s.is_paid = 0`; }
  if (paid === '1') { sql += ` AND s.is_paid = 1`; }
  sql += ` ORDER BY s.created_at DESC`;

  const { results: sets } = await ctx.env.DB.prepare(sql).bind(...binds).all();
  return json({ items: sets });
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const body = await ctx.request.json().catch(() => ({}));
  if (body.action === 'get_overlays') {
    const { results } = await ctx.env.DB.prepare(`SELECT * FROM overlays WHERE set_id = ? AND is_active = 1 ORDER BY order_index ASC`).bind(body.set_id).all();
    return json({ items: results });
  }
  return json({ error: 'Unknown action' }, { status: 400 });
};


