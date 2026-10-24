import { NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('csvText') as string | null;

    let content = '';
    if (file) {
      content = await file.text();
    } else if (rawText) {
      content = rawText;
    } else {
      return NextResponse.json({ error: 'Please upload a CSV file or provide CSV text.' }, { status: 400 });
    }

    const lines = content
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or missing headers.' }, { status: 400 });
    }

    // Parse CSV header
    const headers = lines[0]
      .split(',')
      .map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    const nameIdx = headers.findIndex(h => h === 'name' || h === 'product name');
    const priceIdx = headers.findIndex(h => h === 'price');
    const categoryIdx = headers.findIndex(h => h === 'category');
    const stockIdx = headers.findIndex(h => h === 'stock' || h === 'quantity');
    const skuIdx = headers.findIndex(h => h === 'sku');
    const descIdx = headers.findIndex(h => h === 'desc' || h === 'description');
    const imgIdx = headers.findIndex(h => h === 'image' || h === 'image url');
    const salePriceIdx = headers.findIndex(h => h === 'saleprice' || h === 'sale price');
    const tagIdx = headers.findIndex(h => h === 'tag');

    if (nameIdx === -1 || priceIdx === -1) {
      return NextResponse.json(
        { error: 'CSV header must include at least "name" and "price" columns.' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      // Basic CSV split respecting quotes
      const cells: string[] = [];
      let inQuotes = false;
      let current = '';

      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim().replace(/^["']|["']$/g, ''));

      const name = cells[nameIdx];
      const price = parseFloat(cells[priceIdx]);

      if (!name || isNaN(price)) {
        errors.push(`Row ${i + 1}: Missing name or valid price`);
        continue;
      }

      const category = categoryIdx !== -1 && cells[categoryIdx] ? cells[categoryIdx] : 'Bags';
      const stock = stockIdx !== -1 && !isNaN(parseInt(cells[stockIdx])) ? parseInt(cells[stockIdx]) : 5;
      const sku =
        skuIdx !== -1 && cells[skuIdx]
          ? cells[skuIdx]
          : `SKU-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
      const desc = descIdx !== -1 && cells[descIdx] ? cells[descIdx] : 'Handmade crochet artisanal piece.';
      const image =
        imgIdx !== -1 && cells[imgIdx]
          ? cells[imgIdx]
          : 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=600&q=80';
      const salePrice =
        salePriceIdx !== -1 && !isNaN(parseFloat(cells[salePriceIdx])) ? parseFloat(cells[salePriceIdx]) : null;
      const tag = tagIdx !== -1 && cells[tagIdx] ? cells[tagIdx] : 'HANDMADE';

      await createProduct({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category,
        price,
        salePrice,
        stock,
        sku,
        desc,
        image,
        images: [image],
        emoji: '🧶',
        tag,
        isPublished: true,
        isFeatured: false,
        isBestseller: false,
        isNewArrival: true,
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      totalRows: lines.length - 1,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import CSV' }, { status: 500 });
  }
}
