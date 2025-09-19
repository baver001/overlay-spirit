export interface Env {
  R2?: R2Bucket;
}

// Public proxy for R2 objects by key
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.R2) return new Response('R2 not configured', { status: 500 });
  const url = new URL(ctx.request.url);
  const key = url.searchParams.get('key') || '';
  if (!key) return new Response('Bad Request', { status: 400 });
  const obj = await ctx.env.R2.get(key);
  if (!obj) return new Response('Not Found', { status: 404 });
  const headers = new Headers();
  obj.httpMetadata?.contentType && headers.set('content-type', obj.httpMetadata.contentType);
  return new Response(obj.body, { headers });
};


