import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to compute dashboard metrics' }, { status: 500 });
  }
}
