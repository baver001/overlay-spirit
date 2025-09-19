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

function getCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function getCurrentUser(ctx: EventContext<Env, any, any>): Promise<{ id: string; email: string } | null> {
  const sid = getCookie(ctx.request, 'sid');
  if (!sid) return null;
  const now = Date.now();
  const row = await ctx.env.DB
    .prepare(`SELECT s.user_id as id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND (s.expires_at > ? AND s.revoked_at IS NULL)`) 
    .bind(sid, now)
    .first<any>();
  if (!row) return null;
  return { id: row.id, email: row.email };
}

function formEncode(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// Create Checkout Session (POST /api/stripe)
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  // Branch: webhook handling on query ?webhook=1
  if (url.searchParams.get('webhook') === '1') {
    return handleWebhook(ctx);
  }

  if (!ctx.env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const user = await getCurrentUser(ctx);
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await ctx.request.json().catch(() => null) as { set_id?: string; success_url?: string; cancel_url?: string } | null;
  if (!body?.set_id) return json({ error: 'set_id required' }, { status: 400 });

  const set = await ctx.env.DB
    .prepare(`SELECT id, title, is_paid, price_cents, stripe_price_id FROM overlay_sets WHERE id = ? AND is_active = 1`)
    .bind(body.set_id)
    .first<any>();
  if (!set) return json({ error: 'set not found' }, { status: 404 });
  if (!set.is_paid) return json({ error: 'set is free' }, { status: 400 });
  if (!set.stripe_price_id) return json({ error: 'stripe price not set' }, { status: 400 });

  // Create local purchase record (pending)
  const purchaseId = crypto.randomUUID();
  await ctx.env.DB
    .prepare(`INSERT INTO purchases (id, user_id, set_id, price_cents, currency, status, provider, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(purchaseId, user.id, set.id, set.price_cents ?? 0, 'USD', 'pending', 'stripe', Date.now())
    .run();

  const origin = `${url.protocol}//${url.host}`;
  const successUrl = body.success_url || `${origin}/?checkout=success&purchase_id=${purchaseId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body.cancel_url || `${origin}/?checkout=cancel`;

  const payload: Record<string, string> = {
    mode: 'payment',
    'line_items[0][price]': set.stripe_price_id,
    'line_items[0][quantity]': '1',
    success_url: successUrl,
    cancel_url: cancelUrl,
    'metadata[purchase_id]': purchaseId,
    'metadata[set_id]': set.id,
    'metadata[user_id]': user.id,
    client_reference_id: user.id,
    customer_email: user.email,
  };

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${ctx.env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: formEncode(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    // Mark purchase as failed
    await ctx.env.DB.prepare(`UPDATE purchases SET status = ? WHERE id = ?`).bind('failed', purchaseId).run();
    return json({ error: 'stripe_error', details: errText }, { status: 502 });
  }
  const session = await resp.json<any>();
  return json({ url: session.url, id: session.id, purchase_id: purchaseId });
};

async function handleWebhook(ctx: EventContext<Env, any, any>): Promise<Response> {
  // Stripe sends POST with JSON; verify by fetching event from Stripe.
  if (!ctx.env.STRIPE_SECRET_KEY) return new Response('Stripe not configured', { status: 500 });

  const payloadText = await ctx.request.text();
  let event: any | null = null;
  try {
    const incoming = JSON.parse(payloadText);
    if (incoming && incoming.id) {
      const evResp = await fetch(`https://api.stripe.com/v1/events/${incoming.id}`, {
        headers: {
          'authorization': `Bearer ${ctx.env.STRIPE_SECRET_KEY}`,
        },
      });
      if (evResp.ok) {
        event = await evResp.json<any>();
      } else {
        // Fallback to incoming payload
        event = incoming;
      }
    } else {
      event = incoming;
    }
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  if (!event || !event.type) return new Response('No event', { status: 400 });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data?.object || {};
      const purchaseId: string | undefined = session.metadata?.purchase_id;
      const providerTxnId: string | undefined = session.id;
      if (purchaseId) {
        await ctx.env.DB
          .prepare(`UPDATE purchases SET status = ?, provider_txn_id = ? WHERE id = ?`)
          .bind('paid', providerTxnId || null, purchaseId)
          .run();
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data?.object || {};
      const purchaseId: string | undefined = session.metadata?.purchase_id;
      if (purchaseId) {
        await ctx.env.DB
          .prepare(`UPDATE purchases SET status = ? WHERE id = ?`)
          .bind('expired', purchaseId)
          .run();
      }
      break;
    }
    default:
      // ignore others for now
      break;
  }

  return new Response('ok');
}

// Simple health check (GET /api/stripe)
export const onRequestGet: PagesFunction<Env> = async () => new Response('OK');


