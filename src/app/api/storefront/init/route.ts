import { NextResponse } from 'next/server';
import { getProducts, getCategories, getCollections, getReviews, getOffers } from '@/lib/db';

export const revalidate = 10; // Cache for 10 seconds on Vercel Edge CDN for ultra-fast mobile loading

export async function GET() {
  try {
    const [products, categories, collections, reviews, offers] = await Promise.all([
      getProducts({ onlyPublished: true }).catch(() => []),
      getCategories(true).catch(() => []),
      getCollections().catch(() => []),
      getReviews(true).catch(() => []),
      getOffers(true).catch(() => []),
    ]);

    const bannerOffer = offers.find(o => o.isBannerActive && o.isActive) || null;

    return NextResponse.json(
      {
        products,
        categories,
        collections,
        reviews,
        banner: bannerOffer,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        },
      }
    );
  } catch (error: any) {
    console.error('Storefront init API error:', error);
    return NextResponse.json(
      { error: 'Failed to load storefront data' },
      { status: 500 }
    );
  }
}
