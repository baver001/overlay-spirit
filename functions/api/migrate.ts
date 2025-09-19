export interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const seed = url.searchParams.get('seed') === '1';

  const schema = await (await fetch(new URL('./schema.sql', import.meta.url))).text();
  await DB.exec(schema);

  // Сиды выключены: оставляем параметр для обратной совместимости

  return new Response(JSON.stringify({ ok: true, seeded: seed }), {
    headers: { 'content-type': 'application/json' },
  });
};


