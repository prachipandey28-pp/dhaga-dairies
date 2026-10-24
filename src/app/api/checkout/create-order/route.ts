import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProductById, createOrder, validateCoupon } from '@/lib/db';
import { createRazorpayOrder, isRazorpayConfigured } from '@/lib/razorpay';
import { OrderItem } from '@/types';

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().optional().default(''),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  shippingAddress: z.string().min(5, 'Delivery address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, '6-digit pincode is required'),
  notes: z.string().optional(),
  couponCode: z.string().optional().nullable(),
  paymentMethod: z.string().optional(), // 'whatsapp' | 'razorpay'
  items: z.array(
    z.object({
      id: z.string(),
      qty: z.number().int().positive(),
      variantTitle: z.string().optional(),
    })
  ).min(1, 'Basket cannot be empty'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = checkoutSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input data' }, { status: 400 });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      pincode,
      notes,
      couponCode,
      paymentMethod = 'whatsapp',
      items: rawItems,
    } = result.data;

    const finalEmail = customerEmail && customerEmail.trim()
      ? customerEmail
      : `${customerPhone.replace(/[^0-9]/g, '')}@whatsapp.customer`;

    // Validate every item and calculate price purely from server database
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of rawItems) {
      const product = await getProductById(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.id} not found.` }, { status: 400 });
      }

      if (!product.isPublished) {
        return NextResponse.json({ error: `"${product.name}" is currently unavailable.` }, { status: 400 });
      }

      if (product.stock < item.qty) {
        return NextResponse.json(
          {
            error: `Sorry, only ${product.stock} piece(s) of "${product.name}" are in stock. Please adjust your quantity.`,
          },
          { status: 400 }
        );
      }

      const activePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
      subtotal += activePrice * item.qty;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: activePrice,
        qty: item.qty,
        image: product.image,
        variantTitle: item.variantTitle,
      });
    }

    // Validate coupon code on server if provided
    let discount = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (couponCode && couponCode.trim()) {
      const couponCheck = await validateCoupon(couponCode, subtotal, finalEmail);
      if (!couponCheck.valid) {
        return NextResponse.json({ error: couponCheck.message }, { status: 400 });
      }
      discount = couponCheck.discount;
      appliedCouponCode = couponCheck.coupon?.code;
    }

    // Free shipping on orders over ₹999
    const shippingFee = subtotal >= 999 ? 0 : 79;
    const total = Math.max(0, subtotal - discount + shippingFee);

    // Create DB Order
    const orderNotes = paymentMethod === 'whatsapp'
      ? (notes ? `${notes} [Ordered via WhatsApp]` : '[Ordered via WhatsApp]')
      : (notes || '');

    const order = await createOrder({
      customerName,
      customerEmail: finalEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      pincode,
      notes: orderNotes,
      items: orderItems,
      subtotal,
      discount,
      couponCode: appliedCouponCode,
      shippingFee,
      total,
      currency: 'INR',
      orderStatus: 'Pending',
      paymentStatus: 'pending',
    });

    const amountInPaise = Math.round(total * 100);
    let rpOrderId = `rp_${order.orderNumber}`;
    let isSim = true;

    try {
      const rpOrder = await createRazorpayOrder({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
        },
      });
      rpOrderId = rpOrder.id;
      isSim = rpOrder.isSimulated || !isRazorpayConfigured();
    } catch {
      // Ignored for whatsapp flow
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rpOrderId,
      amount: amountInPaise,
      currency: 'INR',
      subtotal,
      discount,
      shippingFee,
      total,
      keyId,
      paymentMethod,
      isSimulated: isSim,
      customer: {
        name: customerName,
        email: finalEmail,
        contact: customerPhone,
      },
    });
  } catch (error: any) {
    console.error('Error in create-order route:', error);
    return NextResponse.json({ error: error.message || 'Failed to process checkout order' }, { status: 500 });
  }
}
