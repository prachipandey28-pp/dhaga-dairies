import { Product, Category } from '@/types';

const CLOUD_PRODUCT_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1771b37221023';
const CLOUD_CAT_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a17e1dd81e29fd';

export interface CloudSyncData {
  deletedProductIds: string[];
  customProducts: Product[];
  categories?: Category[];
  updatedAt?: string;
}

let inMemoryProductSync: CloudSyncData | null = null;
let lastProductFetchTime = 0;

let inMemoryCategorySync: Category[] | null = null;
let lastCategoryFetchTime = 0;

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

export async function getCloudCategories(): Promise<Category[]> {
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
      const cats: Category[] = Array.isArray(data.cats) ? data.cats : [];
      if (cats.length > 0) {
        inMemoryCategorySync = cats;
        lastCategoryFetchTime = now;
        return cats;
      }
    }
  } catch (err) {
    console.warn('Cloud category sync fetch warning:', err);
  }

  return inMemoryCategorySync || [];
}

export async function saveCloudCategories(cats: Category[]): Promise<Category[]> {
  inMemoryCategorySync = cats;
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
        data: { cats, updatedAt: new Date().toISOString() },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('Cloud category sync PUT warning:', err);
  }

  return cats;
}

export async function saveCloudCategory(cat: Category): Promise<Category[]> {
  const current = await getCloudCategories();
  const existingIdx = current.findIndex(c => c.id === cat.id);
  let updated: Category[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...cat, updatedAt: new Date().toISOString() };
  } else {
    updated = [...current, { ...cat, updatedAt: new Date().toISOString() }];
  }
  return saveCloudCategories(updated);
}

export async function deleteCloudCategory(id: string): Promise<Category[]> {
  const current = await getCloudCategories();
  const updated = current.filter(c => c.id !== id);
  return saveCloudCategories(updated);
}

export function mergeWithCloudCategories(baseCats: Category[], cloudCats?: Category[]): Category[] {
  if (cloudCats && cloudCats.length > 0) {
    const map = new Map<string, Category>();
    // First fill with base
    for (const c of baseCats) {
      map.set(c.id, c);
    }
    // Then override with cloud
    for (const c of cloudCats) {
      map.set(c.id, c);
    }
    return Array.from(map.values()).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
  return baseCats;
}
