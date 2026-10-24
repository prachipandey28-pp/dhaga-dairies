import { NextResponse } from 'next/server';
import { getReviewById, updateReview, deleteReview } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  return NextResponse.json({ review });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const json = await request.json();
    const updated = await updateReview(id, json);
    if (!updated) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const success = await deleteReview(id);
  if (!success) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  return NextResponse.json({ success: true, message: 'Review deleted' });
}
