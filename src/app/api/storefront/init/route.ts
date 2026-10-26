import { NextResponse } from 'next/server';
import { getProducts, getCategories, getCollections, getReviews, getOffers } from '@/lib/db';
import { getCloudSync, mergeWithCloudSync } from '@/lib/cloudSync';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const [rawProducts, categories, collections, reviews, offers, cloudSync] = await Promise.all([
      getProducts({ onlyPublished: true }).catch(() => []),
      getCategories(true).catch(() => []),
      getCollections().catch(() => []),
      getReviews(true).catch(() => []),
      getOffers(true).catch(() => []),
      getCloudSync().catch(() => ({ deletedProductIds: [] as string[], customProducts: [] as any[], updatedAt: new Date().toISOString() })),
    ]);

    const mergedProducts = mergeWithCloudSync(rawProducts, cloudSync);
    const products = mergedProducts.filter(p => p.isPublished);
    const bannerOffer = offers.find(o => o.isBannerActive && o.isActive) || null;

    return NextResponse.json(
      {
        products,
        categories,
        collections,
        reviews,
        banner: bannerOffer,
        cloudSyncVersion: cloudSync.updatedAt || new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
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
