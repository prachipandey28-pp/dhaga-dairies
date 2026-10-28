import { NextResponse } from 'next/server';
import { getProducts, getCategories, getCollections, getReviews, getOffers } from '@/lib/db';
import {
  getCloudSync,
  mergeWithCloudSync,
  getCloudCategories,
  mergeWithCloudCategories,
  getCloudReviews,
  mergeWithCloudReviews,
} from '@/lib/cloudSync';
import { Category, Review } from '@/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const [rawProducts, rawCategories, collections, rawReviews, offers, cloudSync, cloudCats, cloudReviews] = await Promise.all([
      getProducts({ onlyPublished: true }).catch(() => []),
      getCategories(true).catch(() => []),
      getCollections().catch(() => []),
      getReviews(true).catch(() => []),
      getOffers(true).catch(() => []),
      getCloudSync().catch(() => ({ deletedProductIds: [] as string[], customProducts: [] as any[], updatedAt: new Date().toISOString() })),
      getCloudCategories().catch(() => ({ customCategories: [] as Category[], deletedCategoryIds: [] as string[] })),
      getCloudReviews().catch(() => ({ customReviews: [] as Review[], deletedReviewIds: [] as string[] })),
    ]);

    const mergedProducts = mergeWithCloudSync(rawProducts, cloudSync);
    const products = mergedProducts.filter(p => p.isPublished);

    const mergedCategories = mergeWithCloudCategories(rawCategories, cloudCats);
    const categories = mergedCategories.filter(c => c.isActive);

    const mergedReviews = mergeWithCloudReviews(rawReviews, cloudReviews);
    const reviews = mergedReviews.filter(r => r.isApproved);

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
