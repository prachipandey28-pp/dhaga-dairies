import { Product, Category, Review } from '@/types';

const CLOUD_PRODUCT_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1771b37221023';
const CLOUD_CAT_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a17e1dd81e29fd';
const CLOUD_REVIEWS_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a17e45c98c2b50';

export interface CloudSyncData {
  deletedProductIds: string[];
  customProducts: Product[];
  categories?: Category[];
  updatedAt?: string;
}

export interface ReviewSyncData {
  customReviews: Review[];
  deletedReviewIds: string[];
  updatedAt?: string;
}

let inMemoryProductSync: CloudSyncData | null = null;
let lastProductFetchTime = 0;

export interface CategorySyncData {
  customCategories: Category[];
  deletedCategoryIds: string[];
  updatedAt?: string;
}

let inMemoryCategorySync: CategorySyncData | null = null;
let lastCategoryFetchTime = 0;

let inMemoryReviewsSync: ReviewSyncData | null = null;
let lastReviewsFetchTime = 0;

const CACHE_TTL_MS = 2000;

// =========================================================================
// PRODUCT CLOUD SYNC
// =========================================================================

export async function getCloudSync(): Promise<CloudSyncData> {
  const now = Date.now();
  if (inMemoryProductSync && now - lastProductFetchTime < CACHE_TTL_MS) {
    return inMemoryProductSync;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CLOUD_PRODUCT_SYNC_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const data = json?.data || {};
      const result: CloudSyncData = {
        deletedProductIds: Array.isArray(data.deletedProductIds) ? data.deletedProductIds : [],
        customProducts: Array.isArray(data.customProducts) ? data.customProducts : [],
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      inMemoryProductSync = result;
      lastProductFetchTime = now;
      return result;
    }
  } catch (err) {
    console.warn('Cloud product sync fetch warning:', err);
  }

  return inMemoryProductSync || { deletedProductIds: [], customProducts: [] };
}

export async function updateCloudSync(data: Partial<CloudSyncData>): Promise<CloudSyncData> {
  const current = await getCloudSync();
  const next: CloudSyncData = {
    deletedProductIds: data.deletedProductIds ?? current.deletedProductIds,
    customProducts: data.customProducts ?? current.customProducts,
    updatedAt: new Date().toISOString(),
  };
  inMemoryProductSync = next;
  lastProductFetchTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    await fetch(CLOUD_PRODUCT_SYNC_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        name: 'dhaga_store',
        data: next,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('Cloud product sync PUT warning:', err);
  }

  return next;
}

export async function addCloudDeletedId(id: string): Promise<CloudSyncData> {
  const current = await getCloudSync();
  const deletedSet = new Set(current.deletedProductIds || []);
  deletedSet.add(id);
  const updatedCustom = (current.customProducts || []).filter(p => p.id !== id);
  return updateCloudSync({
    deletedProductIds: Array.from(deletedSet),
    customProducts: updatedCustom,
  });
}

export async function saveCloudCustomProduct(product: Product): Promise<CloudSyncData> {
  const current = await getCloudSync();
  const deletedSet = new Set(current.deletedProductIds || []);
  deletedSet.delete(product.id);

  const existingIndex = (current.customProducts || []).findIndex(p => p.id === product.id);
  let updatedCustom = [...(current.customProducts || [])];
  if (existingIndex >= 0) {
    updatedCustom[existingIndex] = product;
  } else {
    updatedCustom.unshift(product);
  }

  return updateCloudSync({
    deletedProductIds: Array.from(deletedSet),
    customProducts: updatedCustom,
  });
}

export function mergeWithCloudSync(baseProducts: Product[], sync: CloudSyncData): Product[] {
  const deletedSet = new Set(sync.deletedProductIds || []);
  const map = new Map<string, Product>();

  // 1. Add base products that are not deleted
  for (const p of baseProducts) {
    if (!deletedSet.has(p.id)) {
      map.set(p.id, p);
    }
  }

  // 2. Add or override with custom products that are not deleted
  for (const p of sync.customProducts || []) {
    if (!deletedSet.has(p.id)) {
      map.set(p.id, p);
    }
  }

  return Array.from(map.values());
}

// =========================================================================
// CATEGORY CLOUD SYNC
// =========================================================================

export function normalizeCategory(c: any, fallback?: Partial<Category>): Category {
  return {
    id: c?.id || fallback?.id || '',
    name: c?.name || fallback?.name || '',
    slug: c?.slug || fallback?.slug || (c?.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''),
    description: c?.description ?? c?.desc ?? fallback?.description ?? '',
    image: c?.image ?? c?.img ?? fallback?.image ?? '',
    icon: c?.icon || fallback?.icon || '🧶',
    displayOrder: Number(c?.displayOrder ?? c?.order ?? fallback?.displayOrder ?? 1),
    isActive: c?.isActive !== false && c?.is_active !== false,
    createdAt: c?.createdAt || fallback?.createdAt || new Date().toISOString(),
    updatedAt: c?.updatedAt || new Date().toISOString(),
  };
}

export async function getCloudCategories(): Promise<CategorySyncData> {
  const now = Date.now();
  if (inMemoryCategorySync && now - lastCategoryFetchTime < CACHE_TTL_MS) {
    return inMemoryCategorySync;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CLOUD_CAT_SYNC_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const data = json?.data || {};
      const rawCats = Array.isArray(data.customCategories)
        ? data.customCategories
        : (Array.isArray(data.cats) ? data.cats : []);
      const deletedIds = Array.isArray(data.deletedCategoryIds) ? data.deletedCategoryIds : [];

      const result: CategorySyncData = {
        customCategories: rawCats.map((c: any) => normalizeCategory(c)),
        deletedCategoryIds: deletedIds,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      inMemoryCategorySync = result;
      lastCategoryFetchTime = now;
      return result;
    }
  } catch (err) {
    console.warn('Cloud category sync fetch warning:', err);
  }

  return inMemoryCategorySync || { customCategories: [], deletedCategoryIds: [] };
}

export async function updateCloudCategories(data: Partial<CategorySyncData>): Promise<CategorySyncData> {
  const current = await getCloudCategories();
  const next: CategorySyncData = {
    customCategories: (data.customCategories ?? current.customCategories).map(c => normalizeCategory(c)),
    deletedCategoryIds: data.deletedCategoryIds ?? current.deletedCategoryIds,
    updatedAt: new Date().toISOString(),
  };
  inMemoryCategorySync = next;
  lastCategoryFetchTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    await fetch(CLOUD_CAT_SYNC_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        name: 'dhaga_categories',
        data: next,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('Cloud category sync PUT warning:', err);
  }

  return next;
}

export async function saveCloudCategory(cat: Category): Promise<CategorySyncData> {
  const current = await getCloudCategories();
  const deletedSet = new Set(current.deletedCategoryIds || []);
  deletedSet.delete(cat.id);

  const existingIdx = current.customCategories.findIndex(c => c.id === cat.id);
  let updatedCustom = [...current.customCategories];
  if (existingIdx >= 0) {
    updatedCustom[existingIdx] = normalizeCategory(cat, updatedCustom[existingIdx]);
  } else {
    updatedCustom.unshift(normalizeCategory(cat));
  }

  return updateCloudCategories({
    customCategories: updatedCustom,
    deletedCategoryIds: Array.from(deletedSet),
  });
}

export async function deleteCloudCategory(id: string): Promise<CategorySyncData> {
  const current = await getCloudCategories();
  const deletedSet = new Set(current.deletedCategoryIds || []);
  deletedSet.add(id);
  const updatedCustom = current.customCategories.filter(c => c.id !== id);

  return updateCloudCategories({
    customCategories: updatedCustom,
    deletedCategoryIds: Array.from(deletedSet),
  });
}

export async function saveCloudCategories(cats: Category[]): Promise<CategorySyncData> {
  return updateCloudCategories({
    customCategories: cats.map(c => normalizeCategory(c)),
  });
}

export function mergeWithCloudCategories(
  baseCats: Category[],
  cloudSync?: CategorySyncData | Category[] | any
): Category[] {
  let deletedSet = new Set<string>();
  let customList: Category[] = [];

  if (cloudSync) {
    if (Array.isArray(cloudSync)) {
      customList = cloudSync;
    } else if (typeof cloudSync === 'object') {
      if (Array.isArray(cloudSync.deletedCategoryIds)) {
        deletedSet = new Set(cloudSync.deletedCategoryIds);
      }
      if (Array.isArray(cloudSync.customCategories)) {
        customList = cloudSync.customCategories;
      } else if (Array.isArray(cloudSync.cats)) {
        customList = cloudSync.cats;
      }
    }
  }

  const map = new Map<string, Category>();

  // 1. Add base categories that are not deleted
  for (const c of baseCats) {
    if (!deletedSet.has(c.id)) {
      map.set(c.id, normalizeCategory(c));
    }
  }

  // 2. Add or override with custom categories that are not deleted
  for (const c of customList) {
    if (c && c.id && !deletedSet.has(c.id)) {
      const existing = map.get(c.id);
      map.set(c.id, normalizeCategory(c, existing));
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

// =========================================================================
// REVIEWS CLOUD SYNC
// =========================================================================

export function normalizeReview(r: any, fallback?: Partial<Review>): Review {
  const custName = r?.customerName ?? r?.c ?? fallback?.customerName ?? '';
  const prodName = r?.productName ?? r?.p ?? fallback?.productName ?? 'Handcrafted Crochet';
  return {
    id: r?.id || fallback?.id || '',
    productId: r?.productId ?? r?.pid ?? fallback?.productId ?? null,
    productName: prodName,
    customerName: custName,
    rating: Number(r?.rating ?? r?.r ?? fallback?.rating ?? 5),
    title: r?.title || r?.t || fallback?.title || prodName,
    quote: r?.quote ?? r?.q ?? fallback?.quote ?? '',
    byline: r?.byline || r?.b || fallback?.byline || (custName ? `— ${custName.toUpperCase()}` : '— CUSTOMER NOTE'),
    image: r?.image ?? r?.img ?? fallback?.image ?? '',
    isApproved: r?.isApproved !== false && r?.a !== false,
    isVerifiedPurchase: r?.isVerifiedPurchase !== false && r?.v !== false,
    createdAt: r?.createdAt || fallback?.createdAt || new Date().toISOString(),
    updatedAt: r?.updatedAt || r?.ts || new Date().toISOString(),
  };
}

export function minifyReview(r: Review): any {
  // Strip heavy base64 strings so restful-api.dev never 500s on 1000-byte limit
  let img = r.image || '';
  if (img.startsWith('data:image/')) {
    img = '';
  }

  const out: Record<string, any> = {
    id: r.id,
    c: r.customerName || '',
    r: Number(r.rating) || 5,
    q: r.quote || '',
  };

  if (r.productId) out.pid = r.productId;
  if (r.productName && r.productName !== 'Handcrafted Crochet') out.p = r.productName;
  if (r.title && r.title !== r.productName) out.t = r.title;
  if (r.byline && !r.byline.includes('CUSTOMER NOTE')) out.b = r.byline;
  if (img) out.img = img;
  if (r.isApproved === false) out.a = false;
  if (r.isVerifiedPurchase === false) out.v = false;
  if (r.updatedAt) out.ts = r.updatedAt;

  return out;
}

export async function getCloudReviews(): Promise<ReviewSyncData> {
  const now = Date.now();
  if (inMemoryReviewsSync && now - lastReviewsFetchTime < CACHE_TTL_MS) {
    return inMemoryReviewsSync;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CLOUD_REVIEWS_SYNC_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const data = json?.data || {};
      const rawCustom = Array.isArray(data.customReviews)
        ? data.customReviews
        : (Array.isArray(data.reviews) ? data.reviews : []);
      const deletedIds = Array.isArray(data.deletedReviewIds) ? data.deletedReviewIds : [];

      const result: ReviewSyncData = {
        customReviews: rawCustom.map((r: any) => normalizeReview(r)),
        deletedReviewIds: deletedIds,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      inMemoryReviewsSync = result;
      lastReviewsFetchTime = now;
      return result;
    }
  } catch (err) {
    console.warn('Cloud reviews sync fetch warning:', err);
  }

  return inMemoryReviewsSync || { customReviews: [], deletedReviewIds: [] };
}

export async function updateCloudReviews(data: Partial<ReviewSyncData>): Promise<ReviewSyncData> {
  const current = await getCloudReviews();
  const next: ReviewSyncData = {
    customReviews: (data.customReviews ?? current.customReviews).map(r => normalizeReview(r)),
    deletedReviewIds: data.deletedReviewIds ?? current.deletedReviewIds,
    updatedAt: new Date().toISOString(),
  };
  inMemoryReviewsSync = next;
  lastReviewsFetchTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const minifiedCustom = next.customReviews.map(r => minifyReview(r));

    await fetch(CLOUD_REVIEWS_SYNC_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        name: 'dhaga_reviews',
        data: {
          customReviews: minifiedCustom,
          deletedReviewIds: next.deletedReviewIds,
          updatedAt: next.updatedAt,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('Cloud reviews sync PUT warning:', err);
  }

  return next;
}

export async function saveCloudReview(review: Review): Promise<ReviewSyncData> {
  const current = await getCloudReviews();
  const deletedSet = new Set(current.deletedReviewIds || []);
  deletedSet.delete(review.id);

  const existingIdx = current.customReviews.findIndex(r => r.id === review.id);
  let updatedCustom = [...current.customReviews];
  const normalized = normalizeReview(review, existingIdx >= 0 ? updatedCustom[existingIdx] : undefined);

  if (existingIdx >= 0) {
    updatedCustom[existingIdx] = normalized;
  } else {
    updatedCustom.unshift(normalized);
  }

  return updateCloudReviews({
    customReviews: updatedCustom,
    deletedReviewIds: Array.from(deletedSet),
  });
}

export async function deleteCloudReview(id: string): Promise<ReviewSyncData> {
  const current = await getCloudReviews();
  const deletedSet = new Set(current.deletedReviewIds || []);
  deletedSet.add(id);
  const updatedCustom = current.customReviews.filter(r => r.id !== id);

  return updateCloudReviews({
    customReviews: updatedCustom,
    deletedReviewIds: Array.from(deletedSet),
  });
}

export function mergeWithCloudReviews(baseReviews: Review[], sync: ReviewSyncData | any): Review[] {
  let deletedSet = new Set<string>();
  let customList: any[] = [];

  if (sync) {
    if (Array.isArray(sync.deletedReviewIds)) {
      deletedSet = new Set(sync.deletedReviewIds);
    }
    if (Array.isArray(sync.customReviews)) {
      customList = sync.customReviews;
    } else if (Array.isArray(sync.reviews)) {
      customList = sync.reviews;
    }
  }

  const map = new Map<string, Review>();

  // 1. Add base reviews that are not deleted
  for (const r of baseReviews) {
    if (!deletedSet.has(r.id)) {
      map.set(r.id, normalizeReview(r));
    }
  }

  // 2. Add or override with custom reviews that are not deleted
  for (const r of customList) {
    if (r && r.id && !deletedSet.has(r.id)) {
      const existing = map.get(r.id);
      map.set(r.id, normalizeReview(r, existing));
    }
  }

  return Array.from(map.values());
}
