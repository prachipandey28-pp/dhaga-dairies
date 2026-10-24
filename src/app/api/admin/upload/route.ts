import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminSession } from '@/lib/auth';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file was provided in the upload request.' }, { status: 400 });
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPEG, PNG, WEBP, GIF, and SVG images are permitted.' },
        { status: 400 }
      );
    }

    // Limit file size to 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.png';
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `products/${cleanBase}_${Date.now()}${ext}`;

    // 1. Upload to Supabase Storage bucket 'product-images' if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filename, buffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(filename);

            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              storage: 'supabase',
              bucket: 'product-images',
              path: filename,
            });
          } else if (error) {
            console.warn('Supabase storage upload error, falling back to local:', error.message);
          }
        } catch (supabaseErr: any) {
          console.warn('Supabase storage exception, falling back to local:', supabaseErr.message);
        }
      }
    }

    // 2. Fallback to local storage in public/uploads/
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const localFilename = `${cleanBase}_${Date.now()}${ext}`;
    const localFilePath = path.join(UPLOADS_DIR, localFilename);
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/${localFilename}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      storage: 'local',
      filename: localFilename,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing the file upload.' },
      { status: 500 }
    );
  }
}
