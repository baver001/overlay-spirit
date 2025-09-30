export interface Env {
  DB: D1Database;
  MIGRATE_TOKEN?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, MIGRATE_TOKEN } = context.env;
  if (!MIGRATE_TOKEN) {
    return new Response('Migrate disabled', { status: 403 });
  }

  const provided = context.request.headers.get('x-migrate-token')
    ?? new URL(context.request.url).searchParams.get('token');

  if (!provided || provided !== MIGRATE_TOKEN) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(context.request.url);
  const seed = url.searchParams.get('seed') === '1';

  const schema = await (await fetch(new URL('./schema.sql', import.meta.url))).text();
  await DB.exec(schema);

  // Сиды выключены: оставляем параметр для обратной совместимости

  return new Response(JSON.stringify({ ok: true, seeded: seed }), {
    headers: { 'content-type': 'application/json' },
  });
};


