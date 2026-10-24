import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCollections, createCollection } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subtitle: z.string().default('Handmade pieces ↗'),
  description: z.string().default(''),
  image: z.string().min(1, 'Image is required'),
  icon: z.string().default('🧶'),
  displayOrder: z.coerce.number().default(1),
  isPublished: z.boolean().default(true),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  const session = await getAdminSession();
  const onlyPublished = !all || !session;

  const collections = await getCollections(onlyPublished);
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const result = collectionSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid collection data' }, { status: 400 });
    }

    const data = result.data;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCol = await createCollection({
      name: data.name,
      slug,
      subtitle: data.subtitle,
      description: data.description,
      image: data.image,
      icon: data.icon,
      displayOrder: data.displayOrder,
      isPublished: data.isPublished,
    });

    return NextResponse.json({ success: true, collection: newCol }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
