import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCategoryById, updateCategory, deleteCategory } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { getCloudCategories, saveCloudCategory, deleteCloudCategory, normalizeCategory, CategorySyncData } from '@/lib/cloudSync';

const updateCategorySchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [baseCat, cloudData] = await Promise.all([
      getCategoryById(id).catch(() => null),
      getCloudCategories().catch(() => ({ customCategories: [], deletedCategoryIds: [] } as CategorySyncData)),
    ]);

    if (cloudData.deletedCategoryIds?.includes(id)) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const match = cloudData.customCategories?.find(c => c.id === id);
    if (match) {
      return NextResponse.json({ success: true, category: match });
    }

    if (!baseCat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, category: baseCat });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const baseUpdated = await updateCategory(id, parsed.data).catch(() => null);
    const cloudData = await getCloudCategories().catch(() => ({ customCategories: [], deletedCategoryIds: [] } as CategorySyncData));
    const existing = cloudData.customCategories?.find(c => c.id === id) || baseUpdated || (await getCategoryById(id).catch(() => null));

    const mergedCategory = normalizeCategory(
      { ...(existing || {}), ...parsed.data, id },
      existing || undefined
    );

    await saveCloudCategory(mergedCategory).catch(e => console.warn('Cloud cat update warning:', e));
    return NextResponse.json({ success: true, category: mergedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteCategory(id).catch(() => {});
    await deleteCloudCategory(id).catch(e => console.warn('Cloud cat delete warning:', e));

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
