import { supabase } from './supabase';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('fetchWithAuth: No session token available');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
