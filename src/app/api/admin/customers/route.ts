import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required to access customer data.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const customers = await getCustomers(query);

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to retrieve customer accounts' }, { status: 500 });
  }
}
