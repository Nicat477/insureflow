const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validUserId(id) { return typeof id === 'string' && uuid.test(id); }
export function authConfig(env = process.env) {
  const mode = env.AUTH_MODE || 'legacy';
  if (!['legacy', 'supabase'].includes(mode)) throw Error('Invalid AUTH_MODE.');
  if (mode === 'legacy') return null;
  const url = new URL(env.SUPABASE_URL || 'invalid');
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.port || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw Error('Use the HTTPS Supabase project URL.');
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!key || !key.startsWith('sb_publishable_')) throw Error('SUPABASE_PUBLISHABLE_KEY must be a publishable key, never a secret key.');
  return { url: url.origin, key };
}
export async function verifiedUser(header, config, fetcher = fetch) {
  const token = typeof header === 'string' && /^Bearer ([A-Za-z0-9_.-]+)$/.exec(header)?.[1];
  if (!token || token.length > 8192) return null;
  const res = await fetcher(config.url + '/auth/v1/user', { headers: { apikey: config.key, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(5000), redirect: 'error' });
  if ([400,401,403].includes(res.status)) return null;
  if (!res.ok) throw Error('Authentication service unavailable.');
  const user = await res.json();
  if (!validUserId(user.id) || !user.email_confirmed_at || user.is_anonymous) return null;
  return user.id;
}
