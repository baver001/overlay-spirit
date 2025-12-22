export interface Env {
  R2?: R2Bucket;
}

// Public proxy for R2 objects by path with automatic thumbnail lookup
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.R2) {
    console.error('[files] R2 not configured');
    return new Response('R2 not configured', { status: 500 });
  }

  // Get the path from params (everything after /api/files/)
  const path = ctx.params.path;
  const key = Array.isArray(path) ? path.join('/') : path;

  if (!key) {
    console.error('[files] Empty key');
    return new Response('Bad Request', { status: 400 });
  }

  // Check for thumbnail request via query params
  const url = new URL(ctx.request.url);
  const thumb = url.searchParams.get('thumb');

  console.log('[files] Requesting key:', key, { thumb });

  try {
    let obj: R2ObjectBody | null = null;
    let actualKey = key;
    
    // If thumbnail requested and key is in overlays/, try to get from thumb/ subfolder first
    if (thumb === '1' && key.startsWith('overlays/') && !key.startsWith('overlays/thumb/')) {
      // Convert overlays/abc123.jpg to overlays/thumb/abc123.jpg
      const thumbKey = key.replace('overlays/', 'overlays/thumb/');
      obj = await ctx.env.R2.get(thumbKey);
      
      if (obj) {
        actualKey = thumbKey;
        console.log('[files] Found thumbnail:', { thumbKey, size: obj.size });
      } else {
        console.log('[files] Thumbnail not found, falling back to original:', { thumbKey });
      }
    }
    
    // If no thumbnail found or not requested, get the original
    if (!obj) {
      obj = await ctx.env.R2.get(key);
    }
    
    if (!obj) {
      console.log('[files] Object not found:', key);
      return new Response('Not Found', { status: 404 });
    }

    console.log('[files] Serving:', { actualKey, size: obj.size, contentType: obj.httpMetadata?.contentType });

    const contentType = obj.httpMetadata?.contentType || 'image/jpeg';
    
    const headers = new Headers();
    headers.set('content-type', contentType);
    
    // Thumbnails get aggressive caching (immutable for 1 year)
    // Original images get shorter cache (1 day)
    if (thumb === '1' || actualKey.includes('/thumb/')) {
      headers.set('cache-control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('cache-control', 'public, max-age=86400');
    }
    
    headers.set('access-control-allow-origin', '*');

    return new Response(obj.body, { headers });
  } catch (error: any) {
    console.error('[files] Error getting object:', { key, error: error?.message || String(error) });
    return new Response('Internal Server Error', { status: 500 });
  }
};

