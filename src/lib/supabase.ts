import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (
    supabaseUrl.includes('placeholder') ||
    supabaseUrl.includes('example.com') ||
    supabaseAnonKey.includes('placeholder')
  ) {
    return false;
  }
  return true;
}

// Client-side / public Supabase client (Anon Key)
export const supabasePublic = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Server-side privileged client (Service Role Key preferred, anon fallback)
// NEVER expose this client or the service role key to the browser!
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
