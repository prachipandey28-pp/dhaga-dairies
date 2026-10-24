import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon } from '@/lib/db';

const validateSchema = z.object({
  code: z.string().min(1, 'Please enter a coupon code'),
  subtotal: z.coerce.number().min(0, 'Subtotal must be positive'),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ valid: false, discount: 0, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { code, subtotal, customerEmail } = parsed.data;
    const result = await validateCoupon(code, subtotal, customerEmail);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { valid: false, discount: 0, message: 'Failed to validate coupon code' },
      { status: 500 }
    );
  }
}
