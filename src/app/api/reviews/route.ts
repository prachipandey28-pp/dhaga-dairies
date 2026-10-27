import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getReviews, createReview, getProductById } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { getCloudReviews, saveCloudReview, mergeWithCloudReviews, ReviewSyncData } from '@/lib/cloudSync';

const reviewSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string().min(1, 'Product name is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  quote: z.string().min(3, 'Review comment is required'),
  byline: z.string().default('— CUSTOMER NOTE'),
  image: z.string().default(''),
  isApproved: z.boolean().default(false),
  isVerifiedPurchase: z.boolean().default(false),
});

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  const onlyApproved = !all || (!session && !isAdminKey);

  try {
    const [baseReviews, cloudReviews] = await Promise.all([
      getReviews(false).catch(() => []),
      getCloudReviews().catch((): ReviewSyncData => ({ customReviews: [], deletedReviewIds: [] })),
    ]);

    let reviews = mergeWithCloudReviews(baseReviews, cloudReviews);
    if (onlyApproved) {
      reviews = reviews.filter(r => r.isApproved);
    }

    return NextResponse.json(
      { success: true, reviews },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ success: true, reviews: [] });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = reviewSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid review data' }, { status: 400 });
    }

    const session = await getAdminSession();
    const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
    const isAuthorizedAdmin = !!session || isAdminKey;

    const data = result.data;
    const isApproved = isAuthorizedAdmin ? (data.isApproved ?? true) : false;

    let productName = data.productName;
    if (data.productId) {
      const prod = await getProductById(data.productId).catch(() => null);
      if (prod) {
        productName = prod.name;
      }
    }

    const defaultReviewImages = [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
      'https://images.unsplash.com/photo-1638427291164-b4adea2f7b96?w=600',
      'https://images.unsplash.com/photo-1749013308478-4176584af239?w=600',
      'https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?w=600',
    ];
    const reviewImage = data.image || defaultReviewImages[Math.floor(Math.random() * defaultReviewImages.length)];

    const newRev = await createReview({
      productId: data.productId || null,
      productName,
      customerName: data.customerName,
      rating: data.rating,
      title: data.title || productName,
      quote: data.quote,
      byline: data.byline || '— CUSTOMER NOTE',
      image: reviewImage,
      isApproved,
      isVerifiedPurchase: data.isVerifiedPurchase,
    });

    // Cloud persistence
    await saveCloudReview(newRev).catch(e => console.warn('Cloud review save error:', e));

    return NextResponse.json({ success: true, review: newRev }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
