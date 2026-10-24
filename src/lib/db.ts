import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  Product,
  Category,
  Collection,
  Review,
  Order,
  PaymentTransaction,
  AdminUser,
  Coupon,
  Offer,
  ProductVariant,
  Customer,
  DashboardStats,
} from '@/types';
import { getSupabaseServerClient, isSupabaseConfigured } from './supabase';

interface DatabaseSchema {
  adminUsers: AdminUser[];
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  collections: Collection[];
  offers: Offer[];
  coupons: Coupon[];
  reviews: Review[];
  orders: Order[];
  transactions: PaymentTransaction[];
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

const DATA_DIR = IS_SERVERLESS
  ? path.join('/tmp', 'dhaga_data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

let inMemoryDb: DatabaseSchema | null = null;

// Ensure local JSON DB file exists for local development/fallback
function ensureDb(): DatabaseSchema {
  if (inMemoryDb) return inMemoryDb;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData = getInitialSeed();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
      } catch {
        // read-only filesystem fallback
      }
      inMemoryDb = initialData;
      return initialData;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    let changed = false;

    // Migrate fields if missing in legacy store.json
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = getInitialSeed().categories;
      changed = true;
    }
    if (!parsed.offers) {
      parsed.offers = getInitialSeed().offers;
      changed = true;
    }
    if (!parsed.coupons) {
      parsed.coupons = getInitialSeed().coupons;
      changed = true;
    }
    if (!parsed.variants) {
      parsed.variants = getInitialSeed().variants;
      changed = true;
    }

    if (changed) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');
      } catch {
        // read-only fallback
      }
    }
    inMemoryDb = parsed;
    return parsed;
  } catch (err) {
    console.warn('Fallback to in-memory database:', err);
    if (!inMemoryDb) {
      inMemoryDb = getInitialSeed();
    }
    return inMemoryDb;
  }
}

function saveDb(data: DatabaseSchema): void {
  inMemoryDb = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('Could not write to disk on serverless, retained in memory:', err);
  }
}

function getInitialSeed(): DatabaseSchema {
  const defaultSalt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('DhagaAdmin@2026!', defaultSalt);

  const adminUsers: AdminUser[] = [
    {
      id: 'admin_1',
      email: 'admin@dhagadiaries.com',
      passwordHash: passwordHash,
      name: 'Dhaga Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'admin_2',
      email: 'owner@dhagadiaries.com',
      passwordHash: bcrypt.hashSync('dhaga-demo', defaultSalt),
      name: 'Store Owner',
      role: 'owner',
      createdAt: new Date().toISOString(),
    },
  ];

  const categories: Category[] = [
    {
      id: 'cat_bags',
      name: 'Bags',
      slug: 'bags',
      description: 'Slowly hand-crocheted everyday totes, pouches, and slings.',
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=600&q=85',
      icon: '👜',
      displayOrder: 1,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat_flowers',
      name: 'Flowers',
      slug: 'flowers',
      description: 'Everlasting blooms crafted with premium cotton yarn that never wilt.',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=85',
      icon: '🌸',
      displayOrder: 2,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat_plushies',
      name: 'Plushies',
      slug: 'plushies',
      description: 'Whimsical companions stuffed with love, softness, and nostalgia.',
      image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=85',
      icon: '🧸',
      displayOrder: 3,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat_accessories',
      name: 'Accessories',
      slug: 'accessories',
      description: 'Delicate crochet scrunchies, coasters, keychains, and charms.',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=85',
      icon: '✨',
      displayOrder: 4,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const products: Product[] = [
    {
      id: 'prod_daisy_tote',
      name: 'Daisy Dream Tote',
      slug: 'daisy-dream-tote',
      category: 'Bags',
      price: 1299,
      salePrice: 1199,
      stock: 8,
      sku: 'BAG-DD-01',
      desc: 'A cheerful everyday bag, stitched slowly by hand with soft milk-cotton yarn. Features sturdy reinforced handles and signature floral motif.',
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=700&q=80',
      images: [
        'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=700&q=80',
        'https://images.unsplash.com/photo-1638427291164-b4adea2f7b96?auto=format&fit=crop&w=900&q=85',
      ],
      emoji: '👜',
      tag: 'BESTSELLER',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'prod_sunflower_stem',
      name: 'Sunflower Stem Keepsake',
      slug: 'sunflower-stem-keepsake',
      category: 'Flowers',
      price: 349,
      salePrice: 299,
      stock: 15,
      sku: 'FLW-SF-02',
      desc: 'Bright wool sunflowers made to sit quietly in vintage bottles on sunny desks. A gift of eternal warmth that never loses its petals.',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80',
      images: [
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80',
      ],
      emoji: '🌸',
      tag: 'HANDMADE',
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: false,
      createdAt: '2026-01-12T10:00:00Z',
      updatedAt: '2026-01-12T10:00:00Z',
    },
    {
      id: 'prod_boba_bear',
      name: 'Boba Bear Plushie',
      slug: 'boba-bear-plushie',
      category: 'Plushies',
      price: 899,
      salePrice: 799,
      stock: 5,
      sku: 'PLS-BB-03',
      desc: 'Pocket-sized palm comfort, holding a tiny pearl cup for slow tea afternoons. Hand-stitched with hypoallergenic velvet yarn.',
      image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=700&q=80',
      images: [
        'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=700&q=80',
      ],
      emoji: '🧸',
      tag: 'NEW ARRIVAL',
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'prod_cherry_scrunchie',
      name: 'Cherry Blossom Scrunchie',
      slug: 'cherry-blossom-scrunchie',
      category: 'Accessories',
      price: 249,
      salePrice: 199,
      stock: 22,
      sku: 'ACC-CB-04',
      desc: 'Gentle on locks, spun in antique ivory and rose-petal stitches. Elastic core reinforced with double-twisted soft yarn.',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80',
      images: [
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80',
      ],
      emoji: '✨',
      tag: 'HANDMADE',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
      createdAt: '2026-01-18T10:00:00Z',
      updatedAt: '2026-01-18T10:00:00Z',
    },
    {
      id: 'prod_lavender_bouquet',
      name: 'Lavender Whisper Bouquet',
      slug: 'lavender-whisper-bouquet',
      category: 'Flowers',
      price: 649,
      salePrice: 549,
      stock: 10,
      sku: 'FLW-LV-05',
      desc: 'Five delicate lavender sprigs bound with natural jute ribbon. Infused with subtle calming lavender essential oils.',
      image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=700&q=80',
      images: [
        'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=700&q=80',
      ],
      emoji: '🌸',
      tag: 'LIMITED EDITION',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-01-20T10:00:00Z',
    },
    {
      id: 'prod_strawberry_pouch',
      name: 'Strawberry Sweetheart Pouch',
      slug: 'strawberry-sweetheart-pouch',
      category: 'Bags',
      price: 799,
      salePrice: 699,
      stock: 6,
      sku: 'BAG-SB-06',
      desc: 'A compact drawstring bag in vibrant strawberry red with tiny white seed embroidery and leafy green ties.',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80',
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80',
      ],
      emoji: '👜',
      tag: 'BESTSELLER',
      isPublished: true,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      createdAt: '2026-01-22T10:00:00Z',
      updatedAt: '2026-01-22T10:00:00Z',
    },
  ];

  const variants: ProductVariant[] = [
    {
      id: 'var_daisy_pink',
      productId: 'prod_daisy_tote',
      title: 'Pastel Pink',
      sku: 'BAG-DD-01-PNK',
      price: 1299,
      stock: 4,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'var_daisy_cream',
      productId: 'prod_daisy_tote',
      title: 'Classic Cream',
      sku: 'BAG-DD-01-CRM',
      price: 1299,
      stock: 4,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'var_sun_yellow',
      productId: 'prod_sunflower_stem',
      title: 'Sun Yellow',
      sku: 'FLW-SF-02-YEL',
      price: 349,
      stock: 10,
      createdAt: '2026-01-12T10:00:00Z',
    },
    {
      id: 'var_sun_amber',
      productId: 'prod_sunflower_stem',
      title: 'Amber Gold',
      sku: 'FLW-SF-02-AMB',
      price: 349,
      stock: 5,
      createdAt: '2026-01-12T10:00:00Z',
    },
  ];

  const collections: Collection[] = [
    {
      id: 'col_bags',
      name: 'Crochet Bags',
      slug: 'bags',
      subtitle: 'Handmade bags ↗',
      description: 'Sturdy, stylish, and slow-crafted crochet tote bags and shoulder purses.',
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=600&q=85',
      icon: '👜',
      displayOrder: 1,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'col_flowers',
      name: 'Yarn Flowers',
      slug: 'flowers',
      subtitle: 'Forever flowers ↗',
      description: 'Delicate yarn tulips, daisies, and lavender sprigs that bloom forever.',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=85',
      icon: '🌷',
      displayOrder: 2,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'col_plushies',
      name: 'Plushies',
      slug: 'plushies',
      subtitle: 'Soft little friends ↗',
      description: 'Adorably crafted amigurumi creatures bringing warmth to every space.',
      image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=85',
      icon: '🧸',
      displayOrder: 3,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'col_accessories',
      name: 'Little Things',
      slug: 'accessories',
      subtitle: 'Tiny treasures ↗',
      description: 'Handmade bookmarks, keychains, coasters, and sweet little gifts.',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=85',
      icon: '✨',
      displayOrder: 4,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const offers: Offer[] = [
    {
      id: 'off_spring_fest',
      title: 'Spring Blossom Celebration',
      description: 'Celebrate hand-knitted creations with 15% off across all boutique pieces.',
      discountType: 'percentage',
      discountValue: 15,
      bannerText: '🌸 SPRING SPECIAL: Flat 15% OFF with code CROCHET15 | Free Shipping on orders over ₹999 🧶',
      isBannerActive: true,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
      scope: 'all',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'off_bag_season',
      title: 'Tote Bag Festival',
      description: 'Get ₹100 direct off on our best-selling artisanal bags and pouches.',
      discountType: 'fixed',
      discountValue: 100,
      bannerText: '👜 Handbag Season: Save ₹100 on every Daisy Tote with code BAG100',
      isBannerActive: false,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      isActive: true,
      scope: 'category',
      category: 'Bags',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const coupons: Coupon[] = [
    {
      id: 'coup_welcome10',
      code: 'WELCOME10',
      description: '10% off for first-time crochet lovers',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscountAmount: 300,
      usageLimit: 500,
      usedCount: 12,
      perCustomerLimit: 1,
      isActive: true,
      scope: 'all',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'coup_crochet15',
      code: 'CROCHET15',
      description: '15% off spring season promotion',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 799,
      maxDiscountAmount: 500,
      usageLimit: 200,
      usedCount: 45,
      perCustomerLimit: 1,
      isActive: true,
      scope: 'all',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'coup_dhaga50',
      code: 'DHAGA50',
      description: 'Flat ₹50 off on any handmade order',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 299,
      maxDiscountAmount: 50,
      usageLimit: 1000,
      usedCount: 78,
      perCustomerLimit: 2,
      isActive: true,
      scope: 'all',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'coup_bag100',
      code: 'BAG100',
      description: 'Flat ₹100 off on bag collection',
      discountType: 'fixed',
      discountValue: 100,
      minOrderAmount: 999,
      maxDiscountAmount: 100,
      usageLimit: 150,
      usedCount: 19,
      perCustomerLimit: 1,
      isActive: true,
      scope: 'category',
      scopeTarget: 'Bags',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const reviews: Review[] = [
    {
      id: 'rev_1',
      productId: 'prod_daisy_tote',
      productName: 'Daisy Dream Tote',
      customerName: 'Priya Sharma',
      rating: 5,
      title: 'Prettier than pictures!',
      quote: 'The stitches are so tight and neat, and the strap doesn\'t dig in even with my iPad inside. Truly feels like an heirloom piece.',
      byline: '— VERIFIED MUMBAI BUYER',
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=400&q=80',
      isApproved: true,
      isVerifiedPurchase: true,
      createdAt: '2026-01-05T12:00:00Z',
    },
    {
      id: 'rev_2',
      productId: 'prod_sunflower_stem',
      productName: 'Sunflower Stem Keepsake',
      customerName: 'Ananya Roy',
      rating: 5,
      title: 'Eternal sunshine on my desk',
      quote: 'Ordered three sunflower stems for my study desk. Everyone who joins my video calls asks where I got them! Packaging was pure poetry.',
      byline: '— VERIFIED BENGALURU BUYER',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80',
      isApproved: true,
      isVerifiedPurchase: true,
      createdAt: '2026-01-08T14:30:00Z',
    },
    {
      id: 'rev_3',
      productId: 'prod_boba_bear',
      productName: 'Boba Bear Plushie',
      customerName: 'Siddharth Nair',
      rating: 5,
      title: 'Cutest gift ever',
      quote: 'Gifted the Boba Bear to my sister for her birthday. She literally teared up. Super soft, beautifully boxed with a handwritten note.',
      byline: '— VERIFIED DELHI BUYER',
      image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=400&q=80',
      isApproved: true,
      isVerifiedPurchase: true,
      createdAt: '2026-01-14T09:15:00Z',
    },
  ];

  return {
    adminUsers,
    categories,
    products,
    variants,
    collections,
    offers,
    coupons,
    reviews,
    orders: [],
    transactions: [],
  };
}

// =========================================================================
// 1. CATEGORIES MANAGEMENT
// =========================================================================

export async function getCategories(onlyActive = false): Promise<Category[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (onlyActive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data) {
        // Compute product count
        const { data: prodData } = await supabase.from('products').select('category');
        return data.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          image: c.image || '',
          icon: c.icon || '🧶',
          displayOrder: c.display_order,
          isActive: c.is_active,
          productCount: (prodData || []).filter(p => p.category?.toLowerCase() === c.name.toLowerCase()).length,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase getCategories fallback:', e);
    }
  }

  const db = ensureDb();
  let list = db.categories || [];
  if (onlyActive) {
    list = list.filter(c => c.isActive);
  }
  return list
    .map(c => ({
      ...c,
      productCount: db.products.filter(p => p.category?.toLowerCase() === c.name.toLowerCase()).length,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          image: data.image || '',
          icon: data.icon || '🧶',
          displayOrder: data.display_order,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase getCategoryById fallback:', e);
    }
  }

  const db = ensureDb();
  return db.categories.find(c => c.id === id || c.slug === id) || null;
}

export async function createCategory(cat: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `cat_${Date.now()}`;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id,
          name: cat.name,
          slug,
          description: cat.description || '',
          image: cat.image || '',
          icon: cat.icon || '🧶',
          display_order: cat.displayOrder || 1,
          is_active: cat.isActive !== false,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          image: data.image || '',
          icon: data.icon || '🧶',
          displayOrder: data.display_order,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createCategory fallback:', e);
    }
  }

  const db = ensureDb();
  const newCat: Category = {
    ...cat,
    id,
    slug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.categories.push(newCat);
  saveDb(db);
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.image !== undefined) payload.image = updates.image;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          image: data.image || '',
          icon: data.icon || '🧶',
          displayOrder: data.display_order,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateCategory fallback:', e);
    }
  }

  const db = ensureDb();
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) return null;

  db.categories[idx] = {
    ...db.categories[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.categories[idx];
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  // Prevent deletion of categories that have active products assigned!
  const category = await getCategoryById(id);
  if (!category) return { success: false, message: 'Category not found' };

  const products = await getProducts();
  const assigned = products.filter(p => p.category?.toLowerCase() === category.name.toLowerCase());
  if (assigned.length > 0) {
    return {
      success: false,
      message: `Cannot delete category "${category.name}". It still has ${assigned.length} product(s) assigned to it. Reassign or delete those products first.`,
    };
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) return { success: true };
    } catch (e) {
      console.warn('Supabase deleteCategory fallback:', e);
    }
  }

  const db = ensureDb();
  db.categories = db.categories.filter(c => c.id !== id);
  saveDb(db);
  return { success: true };
}

// =========================================================================
// 2. PRODUCT MANAGEMENT & VARIANTS
// =========================================================================

export async function getProducts(options?: {
  onlyPublished?: boolean;
  category?: string;
  query?: string;
  featuredOnly?: boolean;
}): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let q = supabase.from('products').select('*, product_variants(*)').order('created_at', { ascending: false });

      if (options?.onlyPublished) {
        q = q.eq('is_published', true);
      }
      if (options?.featuredOnly) {
        q = q.eq('is_featured', true);
      }
      if (options?.category && options.category !== 'All') {
        q = q.ilike('category', options.category);
      }

      const { data, error } = await q;
      if (!error && data) {
        let list: Product[] = data.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          price: Number(p.price),
          salePrice: p.sale_price !== null ? Number(p.sale_price) : null,
          stock: Number(p.stock),
          sku: p.sku,
          desc: p.description || '',
          image: p.image,
          images: Array.isArray(p.images) ? p.images : [],
          emoji: p.emoji || '🧶',
          tag: p.tag || 'HANDMADE',
          isPublished: p.is_published,
          isFeatured: p.is_featured,
          isBestseller: p.is_bestseller,
          isNewArrival: p.is_new_arrival,
          scheduledLaunchAt: p.scheduled_launch_at,
          variants: (p.product_variants || []).map((v: any) => ({
            id: v.id,
            productId: v.product_id,
            title: v.title,
            sku: v.sku,
            price: v.price ? Number(v.price) : null,
            stock: Number(v.stock),
            createdAt: v.created_at,
          })),
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));

        if (options?.query) {
          const search = options.query.toLowerCase();
          list = list.filter(
            p =>
              p.name.toLowerCase().includes(search) ||
              p.desc.toLowerCase().includes(search) ||
              p.sku.toLowerCase().includes(search)
          );
        }
        return list;
      }
    } catch (e) {
      console.warn('Supabase getProducts fallback:', e);
    }
  }

  const db = ensureDb();
  let list = db.products;

  if (options?.onlyPublished) {
    const now = new Date().toISOString();
    list = list.filter(p => p.isPublished && (!p.scheduledLaunchAt || p.scheduledLaunchAt <= now));
  }
  if (options?.featuredOnly) {
    list = list.filter(p => p.isFeatured);
  }
  if (options?.category && options.category !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === options.category!.toLowerCase());
  }
  if (options?.query) {
    const q = options.query.toLowerCase();
    list = list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  // Attach variants from store.json
  const variants = db.variants || [];
  return list.map(p => ({
    ...p,
    variants: variants.filter(v => v.productId === p.id),
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          price: Number(data.price),
          salePrice: data.sale_price !== null ? Number(data.sale_price) : null,
          stock: Number(data.stock),
          sku: data.sku,
          desc: data.description || '',
          image: data.image,
          images: Array.isArray(data.images) ? data.images : [],
          emoji: data.emoji || '🧶',
          tag: data.tag || 'HANDMADE',
          isPublished: data.is_published,
          isFeatured: data.is_featured,
          isBestseller: data.is_bestseller,
          isNewArrival: data.is_new_arrival,
          scheduledLaunchAt: data.scheduled_launch_at,
          variants: (data.product_variants || []).map((v: any) => ({
            id: v.id,
            productId: v.product_id,
            title: v.title,
            sku: v.sku,
            price: v.price ? Number(v.price) : null,
            stock: Number(v.stock),
            createdAt: v.created_at,
          })),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase getProductById fallback:', e);
    }
  }

  const db = ensureDb();
  const prod = db.products.find(p => p.id === id || p.slug === id);
  if (!prod) return null;
  return {
    ...prod,
    variants: (db.variants || []).filter(v => v.productId === prod.id),
  };
}

export async function createProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const slug =
    product.slug ||
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          id,
          name: product.name,
          slug,
          category: product.category,
          price: product.price,
          sale_price: product.salePrice ?? null,
          stock: product.stock,
          sku: product.sku,
          description: product.desc,
          image: product.image,
          images: product.images || [product.image],
          emoji: product.emoji || '🧶',
          tag: product.tag || 'HANDMADE',
          is_published: product.isPublished !== false,
          is_featured: !!product.isFeatured,
          is_bestseller: !!product.isBestseller,
          is_new_arrival: !!product.isNewArrival,
          scheduled_launch_at: product.scheduledLaunchAt || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          price: Number(data.price),
          salePrice: data.sale_price ? Number(data.sale_price) : null,
          stock: Number(data.stock),
          sku: data.sku,
          desc: data.description,
          image: data.image,
          images: data.images || [],
          emoji: data.emoji,
          tag: data.tag,
          isPublished: data.is_published,
          isFeatured: data.is_featured,
          isBestseller: data.is_bestseller,
          isNewArrival: data.is_new_arrival,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createProduct fallback:', e);
    }
  }

  const db = ensureDb();
  const newProduct: Product = {
    ...product,
    id,
    slug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.products.unshift(newProduct);
  saveDb(db);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.salePrice !== undefined) payload.sale_price = updates.salePrice;
      if (updates.stock !== undefined) payload.stock = updates.stock;
      if (updates.sku !== undefined) payload.sku = updates.sku;
      if (updates.desc !== undefined) payload.description = updates.desc;
      if (updates.image !== undefined) payload.image = updates.image;
      if (updates.images !== undefined) payload.images = updates.images;
      if (updates.emoji !== undefined) payload.emoji = updates.emoji;
      if (updates.tag !== undefined) payload.tag = updates.tag;
      if (updates.isPublished !== undefined) payload.is_published = updates.isPublished;
      if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
      if (updates.isBestseller !== undefined) payload.is_bestseller = updates.isBestseller;
      if (updates.isNewArrival !== undefined) payload.is_new_arrival = updates.isNewArrival;
      if (updates.scheduledLaunchAt !== undefined) payload.scheduled_launch_at = updates.scheduledLaunchAt;

      const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          price: Number(data.price),
          salePrice: data.sale_price ? Number(data.sale_price) : null,
          stock: Number(data.stock),
          sku: data.sku,
          desc: data.description,
          image: data.image,
          images: data.images || [],
          emoji: data.emoji,
          tag: data.tag,
          isPublished: data.is_published,
          isFeatured: data.is_featured,
          isBestseller: data.is_bestseller,
          isNewArrival: data.is_new_arrival,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateProduct fallback:', e);
    }
  }

  const db = ensureDb();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) return null;

  db.products[index] = {
    ...db.products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.products[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase deleteProduct fallback:', e);
    }
  }

  const db = ensureDb();
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  if (db.products.length !== initialLength) {
    if (db.variants) {
      db.variants = db.variants.filter(v => v.productId !== id);
    }
    saveDb(db);
    return true;
  }
  return false;
}

// Product Variants
export async function createProductVariant(
  variant: Omit<ProductVariant, 'id' | 'createdAt'>
): Promise<ProductVariant> {
  const id = `var_${Date.now()}`;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert({
          id,
          product_id: variant.productId,
          title: variant.title,
          sku: variant.sku,
          price: variant.price || null,
          stock: variant.stock || 0,
        })
        .select()
        .single();
      if (!error && data) {
        return {
          id: data.id,
          productId: data.product_id,
          title: data.title,
          sku: data.sku,
          price: data.price ? Number(data.price) : null,
          stock: Number(data.stock),
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createProductVariant fallback:', e);
    }
  }

  const db = ensureDb();
  const newVar: ProductVariant = {
    ...variant,
    id,
    createdAt: new Date().toISOString(),
  };
  if (!db.variants) db.variants = [];
  db.variants.push(newVar);
  saveDb(db);
  return newVar;
}

export async function deleteProductVariant(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase deleteProductVariant fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.variants) return false;
  const initial = db.variants.length;
  db.variants = db.variants.filter(v => v.id !== id);
  if (db.variants.length !== initial) {
    saveDb(db);
    return true;
  }
  return false;
}

// =========================================================================
// 3. OFFERS & PROMOTIONS MANAGEMENT
// =========================================================================

export async function getOffers(onlyActive = false): Promise<Offer[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let q = supabase.from('offers').select('*').order('created_at', { ascending: false });
      if (onlyActive) {
        q = q.eq('is_active', true);
      }
      const { data, error } = await q;
      if (!error && data) {
        return data.map(o => ({
          id: o.id,
          title: o.title,
          description: o.description || '',
          discountType: o.discount_type,
          discountValue: Number(o.discount_value),
          bannerText: o.banner_text || '',
          isBannerActive: o.is_banner_active,
          startDate: o.start_date,
          endDate: o.end_date,
          isActive: o.is_active,
          scope: o.scope,
          category: o.category,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase getOffers fallback:', e);
    }
  }

  const db = ensureDb();
  let list = db.offers || [];
  if (onlyActive) {
    const now = Date.now();
    list = list.filter(o => {
      if (!o.isActive) return false;
      if (o.startDate && new Date(o.startDate).getTime() > now) return false;
      if (o.endDate && new Date(o.endDate).getTime() < now) return false;
      return true;
    });
  }
  return list;
}

export async function getActiveBannerOffer(): Promise<Offer | null> {
  const offers = await getOffers(true);
  return offers.find(o => o.isBannerActive && o.bannerText) || null;
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('offers').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          bannerText: data.banner_text || '',
          isBannerActive: data.is_banner_active,
          startDate: data.start_date,
          endDate: data.end_date,
          isActive: data.is_active,
          scope: data.scope,
          category: data.category,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase getOfferById fallback:', e);
    }
  }

  const db = ensureDb();
  return (db.offers || []).find(o => o.id === id) || null;
}

export async function createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
  const id = `off_${Date.now()}`;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('offers')
        .insert({
          id,
          title: offer.title,
          description: offer.description || '',
          discount_type: offer.discountType,
          discount_value: offer.discountValue,
          banner_text: offer.bannerText || '',
          is_banner_active: !!offer.isBannerActive,
          start_date: offer.startDate || null,
          end_date: offer.endDate || null,
          is_active: offer.isActive !== false,
          scope: offer.scope || 'all',
          category: offer.category || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          bannerText: data.banner_text || '',
          isBannerActive: data.is_banner_active,
          startDate: data.start_date,
          endDate: data.end_date,
          isActive: data.is_active,
          scope: data.scope,
          category: data.category,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createOffer fallback:', e);
    }
  }

  const db = ensureDb();
  const newOffer: Offer = {
    ...offer,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.offers) db.offers = [];
  db.offers.unshift(newOffer);
  saveDb(db);
  return newOffer;
}

export async function updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.discountType !== undefined) payload.discount_type = updates.discountType;
      if (updates.discountValue !== undefined) payload.discount_value = updates.discountValue;
      if (updates.bannerText !== undefined) payload.banner_text = updates.bannerText;
      if (updates.isBannerActive !== undefined) payload.is_banner_active = updates.isBannerActive;
      if (updates.startDate !== undefined) payload.start_date = updates.startDate;
      if (updates.endDate !== undefined) payload.end_date = updates.endDate;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.scope !== undefined) payload.scope = updates.scope;
      if (updates.category !== undefined) payload.category = updates.category;

      const { data, error } = await supabase.from('offers').update(payload).eq('id', id).select().single();
      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          bannerText: data.banner_text || '',
          isBannerActive: data.is_banner_active,
          startDate: data.start_date,
          endDate: data.end_date,
          isActive: data.is_active,
          scope: data.scope,
          category: data.category,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateOffer fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.offers) return null;
  const idx = db.offers.findIndex(o => o.id === id);
  if (idx === -1) return null;

  db.offers[idx] = {
    ...db.offers[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.offers[idx];
}

export async function deleteOffer(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase deleteOffer fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.offers) return false;
  const initial = db.offers.length;
  db.offers = db.offers.filter(o => o.id !== id);
  if (db.offers.length !== initial) {
    saveDb(db);
    return true;
  }
  return false;
}

// =========================================================================
// 4. COUPONS MANAGEMENT & SERVER-SIDE VALIDATION
// =========================================================================

export async function getCoupons(onlyActive = false): Promise<Coupon[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let q = supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (onlyActive) {
        q = q.eq('is_active', true);
      }
      const { data, error } = await q;
      if (!error && data) {
        return data.map(c => ({
          id: c.id,
          code: c.code,
          description: c.description || '',
          discountType: c.discount_type,
          discountValue: Number(c.discount_value),
          minOrderAmount: Number(c.min_order_amount || 0),
          maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
          usageLimit: c.usage_limit ? Number(c.usage_limit) : null,
          usedCount: Number(c.used_count || 0),
          perCustomerLimit: Number(c.per_customer_limit || 1),
          validFrom: c.valid_from,
          validUntil: c.valid_until,
          isActive: c.is_active,
          scope: c.scope || 'all',
          scopeTarget: c.scope_target,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase getCoupons fallback:', e);
    }
  }

  const db = ensureDb();
  let list = db.coupons || [];
  if (onlyActive) {
    list = list.filter(c => c.isActive);
  }
  return list;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('coupons').select('*').ilike('code', normalized).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          description: data.description || '',
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          minOrderAmount: Number(data.min_order_amount || 0),
          maxDiscountAmount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
          usageLimit: data.usage_limit ? Number(data.usage_limit) : null,
          usedCount: Number(data.used_count || 0),
          perCustomerLimit: Number(data.per_customer_limit || 1),
          validFrom: data.valid_from,
          validUntil: data.valid_until,
          isActive: data.is_active,
          scope: data.scope || 'all',
          scopeTarget: data.scope_target,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase getCouponByCode fallback:', e);
    }
  }

  const db = ensureDb();
  return (db.coupons || []).find(c => c.code.toUpperCase() === normalized) || null;
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
  const code = coupon.code.trim().toUpperCase();
  const id = `coup_${Date.now()}`;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          id,
          code,
          description: coupon.description || '',
          discount_type: coupon.discountType,
          discount_value: coupon.discountValue,
          min_order_amount: coupon.minOrderAmount || 0,
          max_discount_amount: coupon.maxDiscountAmount || null,
          usage_limit: coupon.usageLimit || null,
          used_count: 0,
          per_customer_limit: coupon.perCustomerLimit || 1,
          valid_from: coupon.validFrom || null,
          valid_until: coupon.validUntil || null,
          is_active: coupon.isActive !== false,
          scope: coupon.scope || 'all',
          scope_target: coupon.scopeTarget || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          description: data.description || '',
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          minOrderAmount: Number(data.min_order_amount),
          maxDiscountAmount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
          usageLimit: data.usage_limit ? Number(data.usage_limit) : null,
          usedCount: Number(data.used_count),
          perCustomerLimit: Number(data.per_customer_limit),
          validFrom: data.valid_from,
          validUntil: data.valid_until,
          isActive: data.is_active,
          scope: data.scope,
          scopeTarget: data.scope_target,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createCoupon fallback:', e);
    }
  }

  const db = ensureDb();
  const newCoupon: Coupon = {
    ...coupon,
    id,
    code,
    usedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.coupons) db.coupons = [];
  db.coupons.unshift(newCoupon);
  saveDb(db);
  return newCoupon;
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.code !== undefined) payload.code = updates.code.toUpperCase();
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.discountType !== undefined) payload.discount_type = updates.discountType;
      if (updates.discountValue !== undefined) payload.discount_value = updates.discountValue;
      if (updates.minOrderAmount !== undefined) payload.min_order_amount = updates.minOrderAmount;
      if (updates.maxDiscountAmount !== undefined) payload.max_discount_amount = updates.maxDiscountAmount;
      if (updates.usageLimit !== undefined) payload.usage_limit = updates.usageLimit;
      if (updates.perCustomerLimit !== undefined) payload.per_customer_limit = updates.perCustomerLimit;
      if (updates.validFrom !== undefined) payload.valid_from = updates.validFrom;
      if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.scope !== undefined) payload.scope = updates.scope;
      if (updates.scopeTarget !== undefined) payload.scope_target = updates.scopeTarget;

      const { data, error } = await supabase.from('coupons').update(payload).eq('id', id).select().single();
      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          description: data.description || '',
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          minOrderAmount: Number(data.min_order_amount),
          maxDiscountAmount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
          usageLimit: data.usage_limit ? Number(data.usage_limit) : null,
          usedCount: Number(data.used_count),
          perCustomerLimit: Number(data.per_customer_limit),
          validFrom: data.valid_from,
          validUntil: data.valid_until,
          isActive: data.is_active,
          scope: data.scope,
          scopeTarget: data.scope_target,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateCoupon fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.coupons) return null;
  const idx = db.coupons.findIndex(c => c.id === id);
  if (idx === -1) return null;

  db.coupons[idx] = {
    ...db.coupons[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.coupons[idx];
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase deleteCoupon fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.coupons) return false;
  const initial = db.coupons.length;
  db.coupons = db.coupons.filter(c => c.id !== id);
  if (db.coupons.length !== initial) {
    saveDb(db);
    return true;
  }
  return false;
}

// Trusted Server-Side Coupon Validation
export async function validateCoupon(
  code: string,
  subtotal: number,
  customerEmail?: string
): Promise<{
  valid: boolean;
  discount: number;
  coupon?: Coupon;
  message: string;
}> {
  if (!code || !code.trim()) {
    return { valid: false, discount: 0, message: 'Please enter a coupon code.' };
  }

  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, discount: 0, message: 'Invalid coupon code.' };
  }

  if (!coupon.isActive) {
    return { valid: false, discount: 0, message: 'This coupon is no longer active.' };
  }

  const now = Date.now();
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now) {
    return { valid: false, discount: 0, message: 'This coupon promotion has not started yet.' };
  }
  if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now) {
    return { valid: false, discount: 0, message: 'This coupon has expired.' };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, message: 'This coupon has reached its total usage limit.' };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order value of ₹${coupon.minOrderAmount} required to use this coupon.`,
    };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    discount,
    coupon,
    message: `Coupon "${coupon.code}" applied! You saved ₹${discount}.`,
  };
}

// =========================================================================
// 5. ORDERS MANAGEMENT & ATOMIC STOCK ADJUSTMENT
// =========================================================================

export async function getOrders(statusFilter?: string, search?: string): Promise<Order[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'All') {
        q = q.eq('order_status', statusFilter);
      }
      const { data, error } = await q;
      if (!error && data) {
        let list: Order[] = data.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone,
          shippingAddress: o.shipping_address,
          city: o.city,
          state: o.state,
          pincode: o.pincode,
          notes: o.notes,
          items: Array.isArray(o.items) ? o.items : [],
          subtotal: Number(o.subtotal),
          discount: Number(o.discount),
          couponCode: o.coupon_code,
          shippingFee: Number(o.shipping_fee),
          total: Number(o.total),
          currency: o.currency || 'INR',
          orderStatus: o.order_status,
          paymentStatus: o.payment_status,
          razorpayOrderId: o.razorpay_order_id,
          razorpayPaymentId: o.razorpay_payment_id,
          razorpaySignature: o.razorpay_signature,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));

        if (search) {
          const s = search.toLowerCase();
          list = list.filter(
            o =>
              o.orderNumber.toLowerCase().includes(s) ||
              o.customerName.toLowerCase().includes(s) ||
              o.customerEmail.toLowerCase().includes(s) ||
              o.customerPhone.includes(s)
          );
        }
        return list;
      }
    } catch (e) {
      console.warn('Supabase getOrders fallback:', e);
    }
  }

  const db = ensureDb();
  let list = db.orders || [];
  if (statusFilter && statusFilter !== 'All') {
    list = list.filter(o => o.orderStatus === statusFilter || o.paymentStatus === statusFilter);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      o =>
        o.orderNumber.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        o.customerEmail.toLowerCase().includes(s) ||
        o.customerPhone.includes(s)
    );
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${id},order_number.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          orderNumber: data.order_number,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          shippingAddress: data.shipping_address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          notes: data.notes,
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal),
          discount: Number(data.discount),
          couponCode: data.coupon_code,
          shippingFee: Number(data.shipping_fee),
          total: Number(data.total),
          currency: data.currency || 'INR',
          orderStatus: data.order_status,
          paymentStatus: data.payment_status,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase getOrderById fallback:', e);
    }
  }

  const db = ensureDb();
  return (db.orders || []).find(o => o.id === id || o.orderNumber === id) || null;
}

export async function getOrderByRazorpayOrderId(rpOrderId: string): Promise<Order | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', rpOrderId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          orderNumber: data.order_number,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          shippingAddress: data.shipping_address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          notes: data.notes,
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal),
          discount: Number(data.discount),
          couponCode: data.coupon_code,
          shippingFee: Number(data.shipping_fee),
          total: Number(data.total),
          currency: data.currency || 'INR',
          orderStatus: data.order_status,
          paymentStatus: data.payment_status,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase getOrderByRazorpayOrderId fallback:', e);
    }
  }

  const db = ensureDb();
  return (db.orders || []).find(o => o.razorpayOrderId === rpOrderId) || null;
}

export async function recordPaymentTransaction(tx: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<PaymentTransaction> {
  const id = `tx_${Date.now()}`;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          id,
          order_id: tx.orderId,
          razorpay_payment_id: tx.razorpayPaymentId,
          razorpay_order_id: tx.razorpayOrderId,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          method: tx.method || null,
          error_description: tx.errorDescription || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          orderId: data.order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpayOrderId: data.razorpay_order_id,
          amount: Number(data.amount),
          currency: data.currency,
          status: data.status,
          method: data.method,
          errorDescription: data.error_description,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase recordPaymentTransaction fallback:', e);
    }
  }

  const db = ensureDb();
  const newTx: PaymentTransaction = {
    ...tx,
    id,
    createdAt: new Date().toISOString(),
  };
  if (!db.transactions) db.transactions = [];
  db.transactions.unshift(newTx);
  saveDb(db);
  return newTx;
}

export async function getPaymentTransactions(): Promise<PaymentTransaction[]> {
  const db = ensureDb();
  return (db.transactions || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createOrder(
  orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `DD-${dateStr}-${rand}`;
  const id = `ord_${Date.now()}_${rand}`;

  // Automatically deduct stock for order items
  await deductProductStock(orderData.items.map(it => ({ productId: it.productId, qty: it.qty })));

  // Increment coupon usage if used
  if (orderData.couponCode) {
    const coupon = await getCouponByCode(orderData.couponCode);
    if (coupon) {
      await updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 });
    }
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          id,
          order_number: orderNumber,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
          shipping_address: orderData.shippingAddress,
          city: orderData.city,
          state: orderData.state,
          pincode: orderData.pincode,
          notes: orderData.notes || '',
          items: orderData.items,
          subtotal: orderData.subtotal,
          discount: orderData.discount || 0,
          coupon_code: orderData.couponCode || null,
          shipping_fee: orderData.shippingFee || 0,
          total: orderData.total,
          currency: orderData.currency || 'INR',
          order_status: orderData.orderStatus || 'Pending',
          payment_status: orderData.paymentStatus || 'pending',
          razorpay_order_id: orderData.razorpayOrderId || null,
          razorpay_payment_id: orderData.razorpayPaymentId || null,
          razorpay_signature: orderData.razorpaySignature || null,
        })
        .select()
        .single();

      if (!error && data) {
        // Also insert into normalized order_items table
        if (orderData.items && orderData.items.length > 0) {
          await supabase.from('order_items').insert(
            orderData.items.map(it => ({
              order_id: id,
              product_id: it.productId,
              product_name: it.name,
              price: it.price,
              quantity: it.qty,
              variant_title: it.variantTitle || null,
              image: it.image || null,
            }))
          );
        }

        return {
          id: data.id,
          orderNumber: data.order_number,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          shippingAddress: data.shipping_address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          notes: data.notes,
          items: data.items,
          subtotal: Number(data.subtotal),
          discount: Number(data.discount),
          couponCode: data.coupon_code,
          shippingFee: Number(data.shipping_fee),
          total: Number(data.total),
          currency: data.currency,
          orderStatus: data.order_status,
          paymentStatus: data.payment_status,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createOrder fallback:', e);
    }
  }

  const db = ensureDb();
  const newOrder: Order = {
    ...orderData,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.orders) db.orders = [];
  db.orders.unshift(newOrder);
  saveDb(db);
  return newOrder;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const existing = await getOrderById(id);

  // If order is changed to 'Cancelled' or 'Refunded', restore product inventory!
  if (
    existing &&
    existing.orderStatus !== 'Cancelled' &&
    existing.orderStatus !== 'Refunded' &&
    (updates.orderStatus === 'Cancelled' || updates.orderStatus === 'Refunded')
  ) {
    if (existing.items && existing.items.length > 0) {
      await restoreProductStock(existing.items.map(it => ({ productId: it.productId, qty: it.qty })));
    }
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.orderStatus !== undefined) payload.order_status = updates.orderStatus;
      if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.razorpayPaymentId !== undefined) payload.razorpay_payment_id = updates.razorpayPaymentId;
      if (updates.razorpayOrderId !== undefined) payload.razorpay_order_id = updates.razorpayOrderId;

      const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single();
      if (!error && data) {
        return {
          id: data.id,
          orderNumber: data.order_number,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          shippingAddress: data.shipping_address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          notes: data.notes,
          items: data.items,
          subtotal: Number(data.subtotal),
          discount: Number(data.discount),
          couponCode: data.coupon_code,
          shippingFee: Number(data.shipping_fee),
          total: Number(data.total),
          currency: data.currency,
          orderStatus: data.order_status,
          paymentStatus: data.payment_status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateOrder fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.orders) return null;
  const idx = db.orders.findIndex(o => o.id === id || o.orderNumber === id);
  if (idx === -1) return null;

  db.orders[idx] = {
    ...db.orders[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.orders[idx];
}

// Deduct stock safely
export async function deductProductStock(items: { productId: string; qty: number }[]): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      for (const item of items) {
        // Call RPC decrement_stock or update directly
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).maybeSingle();
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.qty);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
      }
      return true;
    } catch (e) {
      console.warn('Supabase deductProductStock fallback:', e);
    }
  }

  const db = ensureDb();
  for (const item of items) {
    const p = db.products.find(prod => prod.id === item.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
      p.updatedAt = new Date().toISOString();
    }
  }
  saveDb(db);
  return true;
}

// Restore stock on order cancellation
export async function restoreProductStock(items: { productId: string; qty: number }[]): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).maybeSingle();
        if (prod) {
          await supabase.from('products').update({ stock: prod.stock + item.qty }).eq('id', item.productId);
        }
      }
      return true;
    } catch (e) {
      console.warn('Supabase restoreProductStock fallback:', e);
    }
  }

  const db = ensureDb();
  for (const item of items) {
    const p = db.products.find(prod => prod.id === item.productId);
    if (p) {
      p.stock = p.stock + item.qty;
      p.updatedAt = new Date().toISOString();
    }
  }
  saveDb(db);
  return true;
}

// =========================================================================
// 6. CUSTOMER MANAGEMENT
// =========================================================================

export async function getCustomers(query?: string): Promise<Customer[]> {
  const orders = await getOrders();
  const customerMap = new Map<string, Customer>();

  for (const o of orders) {
    const email = o.customerEmail.toLowerCase().trim();
    if (!customerMap.has(email)) {
      customerMap.set(email, {
        id: `cust_${Math.abs(email.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}`,
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        totalOrders: 1,
        totalSpent: o.total,
        lastOrderDate: o.createdAt,
        firstOrderDate: o.createdAt,
        shippingAddress: o.shippingAddress,
        city: o.city,
        state: o.state,
        pincode: o.pincode,
      });
    } else {
      const existing = customerMap.get(email)!;
      existing.totalOrders += 1;
      existing.totalSpent += o.total;
      if (new Date(o.createdAt).getTime() > new Date(existing.lastOrderDate || 0).getTime()) {
        existing.lastOrderDate = o.createdAt;
      }
      if (new Date(o.createdAt).getTime() < new Date(existing.firstOrderDate || 0).getTime()) {
        existing.firstOrderDate = o.createdAt;
      }
    }
  }

  let list = Array.from(customerMap.values());
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }
  return list.sort((a, b) => b.totalSpent - a.totalSpent);
}

// =========================================================================
// 7. DASHBOARD STATISTICS
// =========================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, orders, offers, coupons] = await Promise.all([
    getProducts(),
    getOrders(),
    getOffers(true),
    getCoupons(true),
  ]);

  const activeProducts = products.filter(p => p.isPublished).length;
  const pendingOrders = orders.filter(
    o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing'
  ).length;

  const validOrders = orders.filter(
    o => o.orderStatus !== 'Cancelled' && o.paymentStatus !== 'failed'
  );
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

  const lowStockProducts = products.filter(p => p.stock <= 3);

  // Group revenue by month
  const salesMap: Record<string, number> = {};
  for (const o of validOrders) {
    const m = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    salesMap[m] = (salesMap[m] || 0) + o.total;
  }
  const salesByMonth = Object.entries(salesMap).map(([month, amount]) => ({ month, amount }));

  return {
    totalProducts: products.length,
    activeProducts,
    totalOrders: orders.length,
    pendingOrders,
    totalRevenue,
    lowStockProductsCount: lowStockProducts.length,
    activeOffersCount: offers.length,
    activeCouponsCount: coupons.length,
    recentOrders: orders.slice(0, 7),
    lowStockProducts,
    salesByMonth,
  };
}

// =========================================================================
// 8. REVIEWS & COLLECTIONS
// =========================================================================

export async function getCollections(onlyPublished = false): Promise<Collection[]> {
  const db = ensureDb();
  let list = db.collections || [];
  if (onlyPublished) {
    list = list.filter(c => c.isPublished);
  }
  return list.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  const db = ensureDb();
  return (db.collections || []).find(c => c.id === id || c.slug === id) || null;
}

export async function createCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
  const db = ensureDb();
  const id = `col_${Date.now()}`;
  const newCol: Collection = {
    ...collection,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.collections) db.collections = [];
  db.collections.push(newCol);
  saveDb(db);
  return newCol;
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<Collection | null> {
  const db = ensureDb();
  if (!db.collections) return null;
  const idx = db.collections.findIndex(c => c.id === id);
  if (idx === -1) return null;

  db.collections[idx] = {
    ...db.collections[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.collections[idx];
}

export async function deleteCollection(id: string): Promise<boolean> {
  const db = ensureDb();
  if (!db.collections) return false;
  const initial = db.collections.length;
  db.collections = db.collections.filter(c => c.id !== id);
  if (db.collections.length !== initial) {
    saveDb(db);
    return true;
  }
  return false;
}

export async function getReviewById(id: string): Promise<Review | null> {
  const db = ensureDb();
  return (db.reviews || []).find(r => r.id === id) || null;
}

export async function getReviews(onlyApproved = false): Promise<Review[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let q = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (onlyApproved) {
        q = q.eq('is_approved', true);
      }
      const { data, error } = await q;
      if (!error && data) {
        return data.map(r => ({
          id: r.id,
          productId: r.product_id,
          productName: r.product_name,
          customerName: r.customer_name,
          rating: Number(r.rating),
          title: r.title || '',
          quote: r.quote,
          byline: r.byline,
          image: r.image,
          isApproved: r.is_approved,
          isVerifiedPurchase: r.is_verified_purchase,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase getReviews fallback:', e);
    }
  }

  const db = ensureDb();
  let list = db.reviews || [];
  if (onlyApproved) {
    list = list.filter(r => r.isApproved);
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  const id = `rev_${Date.now()}`;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          id,
          product_id: review.productId || null,
          product_name: review.productName,
          customer_name: review.customerName,
          rating: review.rating,
          title: review.title || '',
          quote: review.quote,
          byline: review.byline || '— CUSTOMER NOTE',
          image: review.image || '',
          is_approved: review.isApproved !== false,
          is_verified_purchase: !!review.isVerifiedPurchase,
        })
        .select()
        .single();
      if (!error && data) {
        return {
          id: data.id,
          productId: data.product_id,
          productName: data.product_name,
          customerName: data.customer_name,
          rating: Number(data.rating),
          title: data.title,
          quote: data.quote,
          byline: data.byline,
          image: data.image,
          isApproved: data.is_approved,
          isVerifiedPurchase: data.is_verified_purchase,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase createReview fallback:', e);
    }
  }

  const db = ensureDb();
  const newRev: Review = {
    ...review,
    id,
    createdAt: new Date().toISOString(),
  };
  if (!db.reviews) db.reviews = [];
  db.reviews.unshift(newRev);
  saveDb(db);
  return newRev;
}

export async function updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.isApproved !== undefined) payload.is_approved = updates.isApproved;
      if (updates.rating !== undefined) payload.rating = updates.rating;
      if (updates.quote !== undefined) payload.quote = updates.quote;
      if (updates.customerName !== undefined) payload.customer_name = updates.customerName;

      const { data, error } = await supabase.from('reviews').update(payload).eq('id', id).select().single();
      if (!error && data) {
        return {
          id: data.id,
          productId: data.product_id,
          productName: data.product_name,
          customerName: data.customer_name,
          rating: Number(data.rating),
          title: data.title,
          quote: data.quote,
          byline: data.byline,
          image: data.image,
          isApproved: data.is_approved,
          isVerifiedPurchase: data.is_verified_purchase,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase updateReview fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.reviews) return null;
  const idx = db.reviews.findIndex(r => r.id === id);
  if (idx === -1) return null;

  db.reviews[idx] = {
    ...db.reviews[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.reviews[idx];
}

export async function deleteReview(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase deleteReview fallback:', e);
    }
  }

  const db = ensureDb();
  if (!db.reviews) return false;
  const initial = db.reviews.length;
  db.reviews = db.reviews.filter(r => r.id !== id);
  if (db.reviews.length !== initial) {
    saveDb(db);
    return true;
  }
  return false;
}

// =========================================================================
// 9. ADMIN ROLES & AUTHENTICATION
// =========================================================================

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const normalized = email.toLowerCase().trim();
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .ilike('email', normalized)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase findAdminByEmail fallback:', e);
    }
  }

  const db = ensureDb();
  return (db.adminUsers || []).find(u => u.email.toLowerCase() === normalized) || null;
}

export async function verifyAdminRole(userId: string, email: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .or(`user_id.eq.${userId},email.ilike.${email}`)
        .maybeSingle();

      if (!error && data && (data.role === 'admin' || data.role === 'owner' || data.role === 'manager')) {
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Supabase verifyAdminRole fallback:', e);
    }
  }

  // Fallback to local adminUsers
  const admin = await findAdminByEmail(email);
  return !!admin;
}

export async function resetStoreMetricsAndOrders(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('coupons').update({ used_count: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').update({ stock: 10 }).neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Error resetting orders in Supabase:', e);
    }
  }

  const db = ensureDb();
  db.orders = [];
  if (db.coupons) {
    db.coupons = db.coupons.map(c => ({ ...c, usedCount: 0 }));
  }
  if (db.products) {
    db.products = db.products.map(p => ({ ...p, stock: Math.max(8, p.stock || 8) }));
  }
  saveDb(db);

  return {
    success: true,
    message: 'Dashboard metrics, test orders, and inventory stock have been reset to fresh start state.',
  };
}
