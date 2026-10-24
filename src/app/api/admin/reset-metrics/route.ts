import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { resetStoreMetricsAndOrders } from '@/lib/db';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin login required' }, { status: 401 });
    }

    const result = await resetStoreMetricsAndOrders();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in reset-metrics route:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset metrics' }, { status: 500 });
  }
}
