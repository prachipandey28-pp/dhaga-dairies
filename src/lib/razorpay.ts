import crypto from 'crypto';
import Razorpay from 'razorpay';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dhaga_webhook_secret_key';

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes('placeholder')
  );
}

export async function createRazorpayOrder(options: {
  amount: number; // in paise (e.g. 100 rupees = 10000 paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string; isSimulated?: boolean }> {
  const client = getRazorpayClient();
  const currency = options.currency || 'INR';

  if (client) {
    try {
      const order = await client.orders.create({
        amount: options.amount,
        currency,
        receipt: options.receipt,
        notes: options.notes,
      });
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch (err) {
      console.error('Failed to create Razorpay order with official API, falling back to simulated order:', err);
    }
  }

  // Graceful test mode simulation when keys are not configured or test credentials aren't active yet
  const simulatedId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    id: simulatedId,
    amount: options.amount,
    currency,
    isSimulated: true,
  };
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  // If simulated order in dev
  if (params.orderId.startsWith('order_sim_')) {
    return params.signature.startsWith('sig_sim_') || params.signature.length > 5;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // If running in development without secrets configured yet
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return generatedSignature === params.signature;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || webhookSecret;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
}

export async function initiateRazorpayRefund(paymentId: string, amountPaise?: number) {
  const client = getRazorpayClient();
  if (client && !paymentId.startsWith('pay_sim_')) {
    return await client.payments.refund(paymentId, {
      amount: amountPaise,
    });
  }
  return {
    id: `rfnd_sim_${Date.now()}`,
    payment_id: paymentId,
    amount: amountPaise,
    status: 'processed',
    simulated: true,
  };
}
