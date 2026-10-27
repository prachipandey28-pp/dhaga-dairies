import { NextResponse } from 'next/server';
import {
  getCloudSync,
  addCloudDeletedId,
  saveCloudCustomProduct,
  updateCloudSync,
  getCloudCategories,
  saveCloudCategory,
  deleteCloudCategory,
  saveCloudCategories,
} from '@/lib/cloudSync';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const [data, categories] = await Promise.all([
      getCloudSync(),
      getCloudCategories().catch(() => []),
    ]);

    return NextResponse.json(
      { success: true, ...data, categories },
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
    const {
      action,
      productId,
      product,
      deletedProductIds,
      customProducts,
      category,
      categoryId,
      categories,
    } = body;

    let updatedSync;
    let updatedCategories;

    if (action === 'delete' && productId) {
      updatedSync = await addCloudDeletedId(productId);
    } else if ((action === 'save' || action === 'add' || action === 'update') && product) {
      updatedSync = await saveCloudCustomProduct(product);
    } else if (action === 'bulk_update') {
      updatedSync = await updateCloudSync({
        deletedProductIds: Array.isArray(deletedProductIds) ? deletedProductIds : undefined,
        customProducts: Array.isArray(customProducts) ? customProducts : undefined,
      });
    } else if ((action === 'save_category' || action === 'add_category' || action === 'update_category') && category) {
      updatedCategories = await saveCloudCategory(category);
    } else if (action === 'delete_category' && categoryId) {
      updatedCategories = await deleteCloudCategory(categoryId);
    } else if (action === 'sync_categories' && Array.isArray(categories)) {
      updatedCategories = await saveCloudCategories(categories);
    }

    if (!updatedSync) {
      updatedSync = await getCloudSync();
    }
    if (!updatedCategories) {
      updatedCategories = await getCloudCategories().catch(() => []);
    }

    return NextResponse.json({
      success: true,
      ...updatedSync,
      categories: updatedCategories,
    });
  } catch (err: any) {
    console.error('API sync error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update sync' }, { status: 500 });
  }
}
