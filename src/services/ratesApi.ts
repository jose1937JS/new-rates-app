import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import type {
  ApiCurrency,
  ApiPaginatedRatesResponse,
  ApiRateRecord,
  ApiSingleRateResponse,
  ApiSyncResponse,
  ApiTodayRatesResponse,
  SyncSource,
} from '@/types/currency.types';
import {
  API_CACHE_PREFIX,
  API_CACHE_TTL_MS,
  PERSIST_KEY,
  RATES_API_KEY,
  RATES_API_URL,
} from '@/utils/constants';

const REQUEST_TIMEOUT_MS = 10_000;

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const inFlightRequests = new Map<string, Promise<unknown>>();

/** Verify active internet connectivity before issuing network calls */
export async function isNetworkOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

function getCacheStorageKey(cacheKey: string): string {
  return `${API_CACHE_PREFIX}${cacheKey}`;
}

async function readCache<T>(cacheKey: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(getCacheStorageKey(cacheKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache<T>(cacheKey: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    await AsyncStorage.setItem(getCacheStorageKey(cacheKey), JSON.stringify(entry));
  } catch {
    // Ignore storage write errors so app remains functional
  }
}

/**
 * Mark all cached API entries as stale so the next online fetch hits the API,
 * while preserving saved payloads as offline/error fallback.
 */
export async function expireApiCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const apiKeys = keys.filter((key) => key.startsWith(API_CACHE_PREFIX));
    if (apiKeys.length === 0) return;

    const pairs = await AsyncStorage.multiGet(apiKeys);
    const updates: [string, string][] = [];

    for (const [key, raw] of pairs) {
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as CacheEntry<unknown>;
        updates.push([key, JSON.stringify({ ...parsed, cachedAt: 0 })]);
      } catch {
        // Skip malformed entry
      }
    }

    if (updates.length > 0) {
      await AsyncStorage.multiSet(updates);
    }
  } catch {
    // Ignore storage errors
  }
}

/** Permanently remove all cached API and persisted React Query entries */
export async function clearApiCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) => key.startsWith(API_CACHE_PREFIX) || key === PERSIST_KEY,
    );
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Ignore storage errors
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${RATES_API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(RATES_API_KEY ? { 'X-API-Key': RATES_API_KEY } : {}),
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Error HTTP ${response.status} al consultar tasas`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: { forceRefresh?: boolean; ttlMs?: number } = {},
): Promise<T> {
  const { forceRefresh = false, ttlMs = API_CACHE_TTL_MS } = options;
  const cached = await readCache<T>(cacheKey);

  // Return fresh cached response without hitting the API (respects rate limits)
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < ttlMs) {
    return cached.data;
  }

  const online = await isNetworkOnline();
  if (!online) {
    if (cached) return cached.data;
    throw new Error('Sin conexión a internet y sin consultas guardadas.');
  }

  const pending = inFlightRequests.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }

  const requestPromise = (async () => {
    try {
      const data = await fetcher();
      await writeCache(cacheKey, data);
      return data;
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      // Preserve auth errors when uncached, otherwise fall back to saved cache
      if (cached && status !== 401 && status !== 403) {
        return cached.data;
      }
      throw error;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// ----- Public Endpoints -----

/** GET /api/rates/today — Latest BCV_USD, BCV_EUR, and YD_USD with weekend fallback */
export function fetchTodayRates(
  forceRefresh = false,
): Promise<ApiTodayRatesResponse> {
  return fetchWithCache(
    'rates_today',
    () => requestJson<ApiTodayRatesResponse>('/api/rates/today'),
    { forceRefresh },
  );
}

/** GET /api/rates — Paginated recent rates across all currencies (used for % variation) */
export function fetchRecentRates(
  forceRefresh = false,
): Promise<ApiPaginatedRatesResponse> {
  return fetchWithCache(
    'rates_recent_7d',
    () => requestJson<ApiPaginatedRatesResponse>('/api/rates?page=1&limit=60&days=7'),
    { forceRefresh },
  );
}

/** GET /api/rates/:currency — Latest single rate for a specific currency */
export function fetchLatestRateByCurrency(
  currency: ApiCurrency,
  forceRefresh = false,
): Promise<ApiSingleRateResponse> {
  return fetchWithCache(
    `rate_latest_${currency}`,
    () => requestJson<ApiSingleRateResponse>(`/api/rates/${currency}`),
    { forceRefresh },
  );
}

/** GET /api/rates/:currency/all — Historical records for a currency over N days */
export function fetchCurrencyHistory(
  currency: ApiCurrency,
  days = 30,
  forceRefresh = false,
): Promise<ApiRateRecord[]> {
  return fetchWithCache(
    `history_${currency}_${days}d`,
    async () => {
      const page1 = await requestJson<ApiPaginatedRatesResponse>(
        `/api/rates/${currency}/all?page=1&limit=100&days=${days}`,
      );
      if (days >= 14 && page1.pagination.totalPages > 1) {
        const page2 = await requestJson<ApiPaginatedRatesResponse>(
          `/api/rates/${currency}/all?page=2&limit=100&days=${days}`,
        );
        return [...page1.rates, ...page2.rates];
      }
      return page1.rates;
    },
    { forceRefresh },
  );
}

/** POST /api/sync — Trigger immediate manual server sync */
export async function syncRates(
  source: SyncSource = 'all',
): Promise<ApiSyncResponse> {
  const online = await isNetworkOnline();
  if (!online) {
    throw new Error('Se requiere conexión a internet para sincronizar.');
  }

  const result = await requestJson<ApiSyncResponse>(`/api/sync?source=${source}`, {
    method: 'POST',
  });
  await expireApiCache();
  return result;
}
