const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function createSupabaseClient() {
  if (!isSupabaseConfigured()) return null
  const module = await import(/* @vite-ignore */ '@supabase/supabase-js')
  return module.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    realtime: { params: { eventsPerSecond: 10 } }
  })
}
