export interface Env {
  R2?: R2Bucket;
}

// Public proxy for R2 objects by path with optional thumbnail generation
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
  const width = parseInt(url.searchParams.get('w') || '300', 10);
  const height = parseInt(url.searchParams.get('h') || '200', 10);
  const quality = parseInt(url.searchParams.get('q') || '80', 10);

  console.log('[files] Requesting key:', key, { thumb, width, height, quality });

  try {
    const obj = await ctx.env.R2.get(key);
    if (!obj) {
      console.log('[files] Object not found:', key);
      return new Response('Not Found', { status: 404 });
    }

    console.log('[files] Found object:', { key, size: obj.size, contentType: obj.httpMetadata?.contentType });

    const contentType = obj.httpMetadata?.contentType || 'image/jpeg';
    
    // If thumbnail requested and it's an image, use Cloudflare Image Resizing
    // Cloudflare Image Resizing works by fetching the image through Cloudflare's edge network
    // We need to create a response that will be processed by Cloudflare's image resizing
    if (thumb === '1' && contentType.startsWith('image/')) {
      // Read image data
      const imageData = await obj.arrayBuffer();
      
      // Create a response that will trigger Cloudflare Image Resizing
      // The key is to return the image with proper headers and let Cloudflare handle resizing
      // via the cf.image property in the response
      const headers = new Headers();
      headers.set('content-type', contentType);
      headers.set('cache-control', 'public, max-age=31536000, immutable');
      headers.set('access-control-allow-origin', '*');
      
      // Create response with image data
      const response = new Response(imageData, { headers });
      
      // Apply Cloudflare Image Resizing by modifying the response
      // Note: Cloudflare Image Resizing requires the image to be served through Cloudflare's edge
      // and works automatically when using the cf.image property in fetch options
      // However, for direct R2 access, we need to use a different approach
      
      // For now, return the original image with proper caching
      // TODO: Implement proper image resizing using Cloudflare Images API or a library
      // The image will be displayed at the correct size via CSS, but file size won't be reduced
      return response;
    }

    // For full images or non-image files, return original
    const headers = new Headers();
    headers.set('content-type', contentType);
    
    if (thumb === '1') {
      headers.set('cache-control', 'public, max-age=31536000, immutable'); // Cache thumbnails for 1 year
    } else {
      headers.set('cache-control', 'public, max-age=86400'); // Cache full images for 1 day
    }
    
    headers.set('access-control-allow-origin', '*'); // Allow CORS for image loading

    return new Response(obj.body, { headers });
  } catch (error: any) {
    console.error('[files] Error getting object:', { key, error: error?.message || String(error) });
    return new Response('Internal Server Error', { status: 500 });
  }
};

