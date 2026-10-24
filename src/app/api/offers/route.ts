import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOffers, createOffer, getActiveBannerOffer } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

const createOfferSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be greater than zero'),
  bannerText: z.string().optional().default(''),
  isBannerActive: z.boolean().default(false),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  scope: z.enum(['all', 'category']).default('all'),
  category: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') === 'true';
    const bannerOnly = searchParams.get('bannerOnly') === 'true';

    if (bannerOnly) {
      const bannerOffer = await getActiveBannerOffer();
      return NextResponse.json({ success: true, banner: bannerOffer });
    }

    const offers = await getOffers(onlyActive);
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const newOffer = await createOffer({
      title: parsed.data.title,
      description: parsed.data.description,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      bannerText: parsed.data.bannerText,
      isBannerActive: parsed.data.isBannerActive,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      isActive: parsed.data.isActive,
      scope: parsed.data.scope,
      category: parsed.data.category || null,
    });

    return NextResponse.json({ success: true, offer: newOffer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 });
  }
}
