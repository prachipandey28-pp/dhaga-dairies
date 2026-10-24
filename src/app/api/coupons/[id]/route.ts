import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateCoupon, deleteCoupon } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

const updateCouponSchema = z.object({
  code: z.string().optional(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.coerce.number().positive().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscountAmount: z.coerce.number().nullable().optional(),
  usageLimit: z.coerce.number().nullable().optional(),
  perCustomerLimit: z.coerce.number().min(1).optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  scope: z.enum(['all', 'category', 'product']).optional(),
  scopeTarget: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateCoupon(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: error.message || 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteCoupon(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Coupon not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
