import { NextResponse } from 'next/server';
import { testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
    const isAuthorized = !!session || isAdminKey;

    const health = await testSupabaseConnection();

    // If request is from an unauthorized visitor, return basic status without leaking table details
    if (!isAuthorized) {
      return NextResponse.json(
        {
          ok: health.ok,
          configured: health.configured,
          status: health.ok ? 'connected' : health.configured ? 'error' : 'unconfigured',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        health,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('db-health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Database health check failed unexpectedly',
      },
      { status: 500 }
    );
  }
}
