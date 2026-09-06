import type {
  BcvCurrentResponse,
  BcvRate,
  UsdtExchangeRateResponse,
  UsdtHistoricalRatesResponse,
} from '@/types/currency.types';
import { RATES_CDN_URL, API_BASE_URL, AUTH_HEADERS } from '@/utils/constants';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, headers?: HeadersInit): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new ApiError(res.status, `API error ${res.status}: ${url}`);
  }
  return res.json() as Promise<T>;
}

// ----- CDN endpoints (no auth, CORS open) -----

/** Current BCV rate (USD/EUR) with previous and change % */
export function fetchBcvCurrent(): Promise<BcvCurrentResponse> {
  return fetchJson<BcvCurrentResponse>(`${RATES_CDN_URL}/bcv/current.json`);
}

/** All BCV rates for a specific month — rates ordered DESC by date */
export function fetchBcvMonthly(
  year: number,
  month: number,
): Promise<BcvRate[]> {
  return fetchJson<BcvRate[]>(
    `${RATES_CDN_URL}/bcv/${year}/${month}/list.json`,
  );
}

// ----- API endpoints (requires auth) -----

/** Current USDT exchange rate (buy/sell/average) */
export function fetchUsdtRate(): Promise<UsdtExchangeRateResponse> {
  return fetchJson<UsdtExchangeRateResponse>(
    `${API_BASE_URL}/public/usdt/exchange-rate`,
    AUTH_HEADERS,
  );
}

/** Historical USDT rates filtered by date range */
export function fetchUsdtHistory(
  from: string,
  to: string,
): Promise<UsdtHistoricalRatesResponse> {
  const params = new URLSearchParams({ from, to });
  return fetchJson<UsdtHistoricalRatesResponse>(
    `${API_BASE_URL}/public/usdt/exchange-rate/list?${params}`,
    AUTH_HEADERS,
  );
}
