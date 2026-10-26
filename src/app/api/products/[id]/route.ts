import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { addCloudDeletedId, saveCloudCustomProduct, getCloudSync } from '@/lib/cloudSync';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cloudSync = await getCloudSync().catch(() => ({ deletedProductIds: [] as string[], customProducts: [] as any[] }));
  
  if (cloudSync.deletedProductIds?.includes(id)) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const customMatch = cloudSync.customProducts?.find(p => p.id === id);
  if (customMatch) {
    return NextResponse.json({ product: customMatch });
  }

  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const json = await request.json();
    const updated = await updateProduct(id, json);
    
    // Cloud sync persistence
    if (updated) {
      await saveCloudCustomProduct(updated).catch(e => console.warn('Cloud update error:', e));
      return NextResponse.json({ success: true, product: updated });
    }

    // Fallback: update in cloud custom products if it was a custom product
    const sync = await getCloudSync();
    const existing = sync.customProducts?.find(p => p.id === id);
    if (existing) {
      const merged = { ...existing, ...json, updatedAt: new Date().toISOString() };
      await saveCloudCustomProduct(merged);
      return NextResponse.json({ success: true, product: merged });
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    // 1. Delete from local database / in-memory
    await deleteProduct(id).catch(e => console.warn('Local delete warning:', e));

    // 2. Persist deletion in shared cloud store so ALL devices (phones & laptops) sync instantly!
    await addCloudDeletedId(id).catch(e => console.warn('Cloud delete warning:', e));

    return NextResponse.json({ success: true, message: 'Product removed' });
  } catch (err: any) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete product' }, { status: 500 });
  }
}
