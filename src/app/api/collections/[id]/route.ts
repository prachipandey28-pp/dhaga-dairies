import { NextResponse } from 'next/server';
import { getCollectionById, updateCollection, deleteCollection } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const col = await getCollectionById(id);
  if (!col) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  return NextResponse.json({ collection: col });
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
    const updated = await updateCollection(id, json);
    if (!updated) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    return NextResponse.json({ success: true, collection: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const success = await deleteCollection(id);
  if (!success) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  return NextResponse.json({ success: true, message: 'Collection deleted' });
}
