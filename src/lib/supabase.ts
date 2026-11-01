import { createClient } from '@supabase/supabase-js';

export function getSupabaseConfig() {
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const rawSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabaseUrl = rawSupabaseUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  const supabaseAnonKey = rawSupabaseAnonKey.trim().replace(/^["']|["']$/g, '');
  const supabaseServiceRoleKey = rawSupabaseServiceRoleKey.trim().replace(/^["']|["']$/g, '');

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = getSupabaseConfig();
  if (!supabaseUrl) return false;
  if (!supabaseAnonKey && !supabaseServiceRoleKey) return false;
  if (
    supabaseUrl.includes('placeholder') ||
    supabaseUrl.includes('example.com') ||
    supabaseUrl.includes('your-project') ||
    supabaseAnonKey.includes('placeholder') ||
    supabaseAnonKey.includes('your-anon-key')
  ) {
    return false;
  }
  return supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');
}

// Client-side / public Supabase client (Anon Key)
export function getSupabasePublicClient() {
  if (!isSupabaseConfigured()) return null;
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Maintain backwards compatibility export
export const supabasePublic = isSupabaseConfigured() ? getSupabasePublicClient() : null;

// Server-side privileged client (Service Role Key preferred, anon fallback)
// NEVER expose this client or the service role key to the browser!
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = getSupabaseConfig();
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key) return null;

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface SupabaseHealthResult {
  ok: boolean;
  configured: boolean;
  url?: string;
  hasServiceRoleKey: boolean;
  hasAnonKey: boolean;
  latencyMs: number;
  error?: string;
  tables: Record<string, { ok: boolean; count?: number; error?: string }>;
  storage: { ok: boolean; bucket: string; error?: string };
}

/**
 * Diagnostic test utility to verify connectivity across all 13 PostgreSQL tables
 * and the Supabase Storage bucket 'product-images'.
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthResult> {
  const configured = isSupabaseConfigured();
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = getSupabaseConfig();

  const result: SupabaseHealthResult = {
    ok: false,
    configured,
    url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/[^.]+).*/, '$1.supabase.co') : undefined,
    hasServiceRoleKey: Boolean(supabaseServiceRoleKey && !supabaseServiceRoleKey.includes('placeholder')),
    hasAnonKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('placeholder')),
    latencyMs: 0,
    tables: {},
    storage: { ok: false, bucket: 'product-images' },
  };

  if (!configured) {
    result.error = 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are either missing or contain placeholder values.';
    return result;
  }

  const client = getSupabaseServerClient();
  if (!client) {
    result.error = 'Could not initialize Supabase server client.';
    return result;
  }

  const start = Date.now();
  const tablesToCheck = [
    'categories',
    'products',
    'product_variants',
    'collections',
    'offers',
    'coupons',
    'coupon_redemptions',
    'orders',
    'order_items',
    'payment_transactions',
    'reviews',
    'customers',
    'admin_roles',
  ];

  let allTablesOk = true;

  await Promise.all(
    tablesToCheck.map(async (table) => {
      try {
        const { count, error } = await client
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          allTablesOk = false;
          result.tables[table] = { ok: false, error: error.message };
        } else {
          result.tables[table] = { ok: true, count: count ?? 0 };
        }
      } catch (err: any) {
        allTablesOk = false;
        result.tables[table] = { ok: false, error: err?.message || 'Query failed' };
      }
    })
  );

  result.latencyMs = Date.now() - start;

  // Test Storage bucket 'product-images'
  try {
    const { data, error } = await client.storage.from('product-images').list('', { limit: 1 });
    if (error) {
      result.storage = { ok: false, bucket: 'product-images', error: error.message };
    } else {
      result.storage = { ok: true, bucket: 'product-images' };
    }
  } catch (storageErr: any) {
    result.storage = { ok: false, bucket: 'product-images', error: storageErr?.message || 'Storage check failed' };
  }

  result.ok = allTablesOk && result.storage.ok;
  if (!result.ok && !result.error) {
    const failedTables = Object.entries(result.tables).filter(([_, v]) => !v.ok).map(([k]) => k);
    if (failedTables.length > 0) {
      result.error = `Tables inaccessible or missing: ${failedTables.join(', ')}`;
    } else if (!result.storage.ok) {
      result.error = `Storage bucket issue: ${result.storage.error}`;
    }
  }

  return result;
}
