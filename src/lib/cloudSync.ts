import { Product } from '@/types';

const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1771b37221023';

export interface CloudSyncData {
  deletedProductIds: string[];
  customProducts: Product[];
  updatedAt?: string;
}

let inMemorySyncCache: CloudSyncData | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 2500;

export async function getCloudSync(): Promise<CloudSyncData> {
  const now = Date.now();
  if (inMemorySyncCache && now - lastFetchTime < CACHE_TTL_MS) {
    return inMemorySyncCache;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CLOUD_SYNC_URL, {
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
      inMemorySyncCache = result;
      lastFetchTime = now;
      return result;
    }
  } catch (err) {
    console.warn('Cloud sync fetch warning:', err);
  }

  return inMemorySyncCache || { deletedProductIds: [], customProducts: [] };
}

export async function updateCloudSync(data: Partial<CloudSyncData>): Promise<CloudSyncData> {
  const current = await getCloudSync();
  const next: CloudSyncData = {
    deletedProductIds: data.deletedProductIds ?? current.deletedProductIds,
    customProducts: data.customProducts ?? current.customProducts,
    updatedAt: new Date().toISOString(),
  };
  inMemorySyncCache = next;
  lastFetchTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    await fetch(CLOUD_SYNC_URL, {
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
    console.warn('Cloud sync PUT warning:', err);
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
