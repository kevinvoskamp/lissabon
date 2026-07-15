import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Is er een echte Supabase-config (en geen placeholder uit .env.example)? */
export const isSupabaseConfigured: boolean =
  !!url && !!anonKey && !url.includes('JOUW-PROJECT-REF') && !anonKey.includes('JOUW-ANON')

/**
 * Supabase-client, of null als de keys ontbreken. In dat geval werkt de app
 * gewoon door op localStorage (per apparaat) — alleen zonder synchronisatie.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null
