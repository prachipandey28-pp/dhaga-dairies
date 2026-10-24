import { NextResponse } from 'next/server';
import { getOrderById, updateOrder, recordPaymentTransaction } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { initiateRazorpayRefund } from '@/lib/razorpay';
import { OrderStatus } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const json = await request.json();
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const newStatus = json.orderStatus as OrderStatus | undefined;
    let refundResult = null;

    if (newStatus === 'Refunded' && order.paymentStatus === 'paid' && order.razorpayPaymentId) {
      // Initiate refund via Razorpay
      try {
        refundResult = await initiateRazorpayRefund(order.razorpayPaymentId, Math.round(order.total * 100));
        await recordPaymentTransaction({
          orderId: order.id,
          razorpayPaymentId: order.razorpayPaymentId,
          razorpayOrderId: order.razorpayOrderId || '',
          amount: order.total,
          currency: order.currency,
          status: 'refunded',
          method: 'Razorpay Refund',
        });
        json.paymentStatus = 'refunded';
      } catch (err: any) {
        console.error('Razorpay refund error:', err);
        return NextResponse.json({ error: `Refund failed: ${err.message || 'Payment gateway error'}` }, { status: 500 });
      }
    }

    const updated = await updateOrder(id, json);
    return NextResponse.json({ success: true, order: updated, refund: refundResult });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
