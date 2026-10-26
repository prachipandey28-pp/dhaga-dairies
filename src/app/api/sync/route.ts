import { NextResponse } from 'next/server';
import {
  getCloudSync,
  addCloudDeletedId,
  saveCloudCustomProduct,
  updateCloudSync,
} from '@/lib/cloudSync';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getCloudSync();
    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, productId, product, deletedProductIds, customProducts } = body;

    let updatedSync;
    if (action === 'delete' && productId) {
      updatedSync = await addCloudDeletedId(productId);
    } else if ((action === 'save' || action === 'add' || action === 'update') && product) {
      updatedSync = await saveCloudCustomProduct(product);
    } else if (action === 'bulk_update') {
      updatedSync = await updateCloudSync({
        deletedProductIds: Array.isArray(deletedProductIds) ? deletedProductIds : undefined,
        customProducts: Array.isArray(customProducts) ? customProducts : undefined,
      });
    } else {
      updatedSync = await getCloudSync();
    }

    return NextResponse.json({ success: true, ...updatedSync });
  } catch (err: any) {
    console.error('API sync error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update sync' }, { status: 500 });
  }
}
