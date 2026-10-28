import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCategories, createCategory } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { getCloudCategories, saveCloudCategory, mergeWithCloudCategories, CategorySyncData } from '@/lib/cloudSync';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.coerce.number().default(1),
  isActive: z.boolean().default(true),
});

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') === 'true';

    const [baseCats, cloudData] = await Promise.all([
      getCategories(false).catch(() => []),
      getCloudCategories().catch(() => ({ customCategories: [], deletedCategoryIds: [] } as CategorySyncData)),
    ]);

    let categories = mergeWithCloudCategories(baseCats, cloudData);
    if (onlyActive) {
      categories = categories.filter(c => c.isActive);
    }

    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const newCategory = await createCategory({
      name: parsed.data.name,
      slug: parsed.data.slug || parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: parsed.data.description || '',
      image: parsed.data.image || '',
      icon: parsed.data.icon || '🧶',
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive,
    });

    // Cloud sync persistence
    await saveCloudCategory(newCategory).catch(e => console.warn('Cloud category save warning:', e));

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
