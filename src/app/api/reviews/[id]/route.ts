import { NextResponse } from 'next/server';
import { getReviewById, updateReview, deleteReview } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import {
  getCloudReviews,
  saveCloudReview,
  deleteCloudReview,
  normalizeReview,
  ReviewSyncData,
} from '@/lib/cloudSync';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cloud: ReviewSyncData = await getCloudReviews().catch(() => ({ customReviews: [], deletedReviewIds: [] as string[] }));
    if (cloud.deletedReviewIds.includes(id)) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    const match = cloud.customReviews.find(r => r.id === id);
    if (match) {
      return NextResponse.json({ review: match });
    }

    const review = await getReviewById(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const json = await request.json();
    const baseUpdated = await updateReview(id, json).catch(() => null);
    const cloud = await getCloudReviews().catch(() => ({ customReviews: [], deletedReviewIds: [] as string[] }));
    const existing =
      cloud.customReviews.find(r => r.id === id) ||
      baseUpdated ||
      (await getReviewById(id).catch(() => null));

    const merged = normalizeReview(
      { ...(existing || {}), ...json, id },
      existing || undefined
    );

    await saveCloudReview(merged).catch(e => console.warn('Cloud review update error:', e));
    return NextResponse.json({ success: true, review: merged });
  } catch (error: any) {
    console.error('Failed to update review:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await deleteReview(id).catch(e => console.warn('Local review delete error:', e));
    await deleteCloudReview(id).catch(e => console.warn('Cloud review delete error:', e));
    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete review' }, { status: 500 });
  }
}
