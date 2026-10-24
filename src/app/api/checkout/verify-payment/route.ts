import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, updateOrder, deductProductStock, recordPaymentTransaction } from '@/lib/db';
import { verifyPaymentSignature } from '@/lib/razorpay';

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = verifySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = result.data;

    // 1. Fetch order from database
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Prevent duplicate payment processing
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Order already processed',
        orderNumber: order.orderNumber,
      });
    }

    // 3. Cryptographically verify signature on server
    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      // Record failed transaction attempt
      await recordPaymentTransaction({
        orderId: order.id,
        razorpayPaymentId,
        razorpayOrderId,
        amount: order.total,
        currency: order.currency,
        status: 'failed',
        errorDescription: 'Signature verification failed',
      });

      return NextResponse.json({ error: 'Payment signature verification failed. Please contact support.' }, { status: 400 });
    }

    // 4. Deduct inventory stock safely
    const stockDeducted = await deductProductStock(
      order.items.map(item => ({ productId: item.productId, qty: item.qty }))
    );

    if (!stockDeducted) {
      console.warn(`Stock deduction warning for order ${order.orderNumber}: some items had insufficient stock.`);
    }

    // 5. Update order status
    const updated = await updateOrder(order.id, {
      paymentStatus: 'paid',
      orderStatus: 'Processing',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    // 6. Record successful payment transaction
    await recordPaymentTransaction({
      orderId: order.id,
      razorpayPaymentId,
      razorpayOrderId,
      amount: order.total,
      currency: order.currency,
      status: 'captured',
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully! Thank you for supporting Dhaga Diaries.',
      order: updated,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
