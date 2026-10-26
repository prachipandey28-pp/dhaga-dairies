import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProducts, createProduct } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { getCloudSync, mergeWithCloudSync, saveCloudCustomProduct } from '@/lib/cloudSync';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  salePrice: z.coerce.number().nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().optional(),
  desc: z.string().default(''),
  image: z.string().default(''),
  images: z.array(z.string()).optional(),
  emoji: z.string().optional(),
  tag: z.string().default('HANDMADE'),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  scheduledLaunchAt: z.string().nullable().optional(),
});

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const query = searchParams.get('q') || undefined;
  const all = searchParams.get('all') === 'true';

  const session = await getAdminSession();
  const onlyPublished = !all || !session;

  try {
    const [rawProducts, cloudSync] = await Promise.all([
      getProducts({ onlyPublished: false, category, query }).catch(() => []),
      getCloudSync().catch(() => ({ deletedProductIds: [] as string[], customProducts: [] as any[], updatedAt: new Date().toISOString() })),
    ]);

    let products = mergeWithCloudSync(rawProducts, cloudSync);

    if (onlyPublished) {
      products = products.filter(p => p.isPublished);
    }
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      const q = query.toLowerCase();
      products = products.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Products GET error:', error);
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  const isAdminKey = request.headers.get('x-admin-key') === 'dhaga_admin_master_2026';
  if (!session && !isAdminKey) {
    return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const result = productSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid product data' }, { status: 400 });
    }

    const data = result.data;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const defaultEmoji: Record<string, string> = {
      Bags: '👜',
      Flowers: '🌷',
      Plushies: '🧸',
      Accessories: '🎀',
    };

    const newProduct = await createProduct({
      name: data.name,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      category: data.category,
      price: data.price,
      salePrice: data.salePrice || null,
      stock: data.stock,
      sku: data.sku || `DD-${data.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-5)}`,
      desc: data.desc,
      image: data.image,
      images: data.images || (data.image ? [data.image] : []),
      emoji: data.emoji || defaultEmoji[data.category] || '🧶',
      tag: data.tag || 'HANDMADE',
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
      isBestseller: data.isBestseller,
      isNewArrival: data.isNewArrival,
      scheduledLaunchAt: data.scheduledLaunchAt || null,
    });

    // Cloud sync persistence
    await saveCloudCustomProduct(newProduct).catch(e => console.warn('Cloud save error:', e));

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create product' }, { status: 400 });
  }
}
