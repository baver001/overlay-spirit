import { jwtVerify } from 'jose';

export async function verifySupabaseToken(token: string, secret: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload;
}
