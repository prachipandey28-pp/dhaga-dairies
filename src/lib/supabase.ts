import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const rawSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Clean whitespace, enclosing quotes, and trailing slashes
const supabaseUrl = rawSupabaseUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
const supabaseAnonKey = rawSupabaseAnonKey.trim().replace(/^["']|["']$/g, '');
const supabaseServiceRoleKey = rawSupabaseServiceRoleKey.trim().replace(/^["']|["']$/g, '');

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
