import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getReviews, createReview, getProductById } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

const reviewSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string().min(1, 'Product name is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  quote: z.string().min(3, 'Review comment is required'),
  byline: z.string().default('— CUSTOMER NOTE'),
  image: z.string().min(1, 'Review image URL is required'),
  isApproved: z.boolean().default(false),
  isVerifiedPurchase: z.boolean().default(false),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  const session = await getAdminSession();
  const onlyApproved = !all || !session;

  const reviews = await getReviews(onlyApproved);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = reviewSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid review data' }, { status: 400 });
    }

    const session = await getAdminSession();
    const data = result.data;

    // If submitted by regular visitor, default isApproved = false
    // If admin is creating it, allow setting isApproved
    const isApproved = session ? (data.isApproved ?? true) : false;

    // Check if productId provided, update productName if needed
    let productName = data.productName;
    if (data.productId) {
      const prod = await getProductById(data.productId);
      if (prod) {
        productName = prod.name;
      }
    }

    const newRev = await createReview({
      productId: data.productId || null,
      productName,
      customerName: data.customerName,
      rating: data.rating,
      title: data.title || productName,
      quote: data.quote,
      byline: data.byline || '— CUSTOMER NOTE',
      image: data.image,
      isApproved,
      isVerifiedPurchase: data.isVerifiedPurchase,
    });

    return NextResponse.json({ success: true, review: newRev }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
