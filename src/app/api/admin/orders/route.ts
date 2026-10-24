import { NextResponse } from 'next/server';
import { getOrders, getPaymentTransactions } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;

  const orders = await getOrders(status);
  const transactions = await getPaymentTransactions();

  return NextResponse.json({ orders, transactions });
}
