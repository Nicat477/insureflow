import { createClient, type SupabaseClient } from '@supabase/supabase-js'
let client: SupabaseClient | null = null
let pending: Promise<SupabaseClient | null> | null = null
export function getAccountClient() {
  if (!pending) pending = (async () => {
    const response = await fetch('/api/auth/config', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error('Cannot load authentication configuration.')
    const config = await response.json() as { enabled: boolean; url?: string; key?: string }
    if (!config.enabled) return null
    if (!config.url || !config.key) throw new Error('Authentication is not configured.')
    client = createClient(config.url, config.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'insureflow-supabase-auth' } })
    return client
  })().catch(error => { pending = null; throw error })
  return pending
}
export async function accountAuthorization() {
  const c = client ?? await getAccountClient()
  if (!c) return null
  const { data, error } = await c.auth.getSession()
  if (error || !data.session) throw new Error('Sign in to access your workspace.')
  return 'Bearer ' + data.session.access_token
}
