import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCoupons, createCoupon } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

const createCouponSchema = z.object({
  code: z.string().min(2, 'Coupon code must be at least 2 characters'),
  description: z.string().optional().default(''),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be positive'),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscountAmount: z.coerce.number().nullable().optional(),
  usageLimit: z.coerce.number().nullable().optional(),
  perCustomerLimit: z.coerce.number().min(1).default(1),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  scope: z.enum(['all', 'category', 'product']).default('all'),
  scopeTarget: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required to list coupons' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') === 'true';
    const coupons = await getCoupons(onlyActive);
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const newCoupon = await createCoupon({
      code: parsed.data.code,
      description: parsed.data.description,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      minOrderAmount: parsed.data.minOrderAmount,
      maxDiscountAmount: parsed.data.maxDiscountAmount || null,
      usageLimit: parsed.data.usageLimit || null,
      perCustomerLimit: parsed.data.perCustomerLimit,
      validFrom: parsed.data.validFrom || null,
      validUntil: parsed.data.validUntil || null,
      isActive: parsed.data.isActive,
      scope: parsed.data.scope,
      scopeTarget: parsed.data.scopeTarget || null,
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}
