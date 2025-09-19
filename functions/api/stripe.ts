export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

// Create checkout session (client posts set_id)
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const body = await ctx.request.json().catch(() => null) as { set_id?: string } | null;
  if (!body?.set_id) return json({ error: 'set_id required' }, { status: 400 });

  // Placeholder: we only record intent and return ok. Real Stripe to be wired with secret.
  const set = await ctx.env.DB.prepare(`SELECT id, stripe_price_id FROM overlay_sets WHERE id = ?`).bind(body.set_id).first();
  if (!set || !set.stripe_price_id) return json({ error: 'set not purchasable' }, { status: 400 });

  // Normally: call Stripe API to create checkout session, return url
  return json({ ok: true, message: 'Stripe integration stub. Configure STRIPE_SECRET_KEY and webhook.' });
};

// Webhook stub
export const onRequestGet: PagesFunction<Env> = async () => new Response('OK');


