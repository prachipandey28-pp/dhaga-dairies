import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { getOrderByRazorpayOrderId, updateOrder, recordPaymentTransaction, deductProductStock } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        const order = await getOrderByRazorpayOrderId(razorpayOrderId);
        if (order && order.paymentStatus !== 'paid') {
          await deductProductStock(
            order.items.map(item => ({ productId: item.productId, qty: item.qty }))
          );

          await updateOrder(order.id, {
            paymentStatus: 'paid',
            orderStatus: 'Processing',
            razorpayPaymentId,
          });

          await recordPaymentTransaction({
            orderId: order.id,
            razorpayPaymentId,
            razorpayOrderId,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: 'captured',
            method: payment.method,
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        const order = await getOrderByRazorpayOrderId(razorpayOrderId);
        if (order) {
          await updateOrder(order.id, {
            paymentStatus: 'failed',
          });

          await recordPaymentTransaction({
            orderId: order.id,
            razorpayPaymentId,
            razorpayOrderId,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: 'failed',
            errorDescription: payment.error_description || 'Payment failed',
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}
