// ----- API Response Types -----

/** Single BCV rate row from CDN */
export interface BcvRate {
  usd: number;
  eur: number;
  date: string; // ISO yyyy-mm-dd
}

/** GET /bcv/current.json */
export interface BcvCurrentResponse {
  current: BcvRate;
  previous: BcvRate;
  changePercentage: {
    usd: number;
    eur: number;
  };
}

/** Single USDT exchange rate */
export interface UsdtExchangeRate {
  buy: number;
  sell: number;
  average: number;
  date: string;
}

/** GET /public/usdt/exchange-rate */
export interface UsdtExchangeRateResponse {
  current: UsdtExchangeRate;
  previous?: UsdtExchangeRate;
  changePercentage: {
    buy: number;
    sell: number;
    average: number;
  };
}

/** GET /public/usdt/exchange-rate/list */
export interface UsdtHistoricalRatesResponse {
  rates: UsdtHistoricalRate[];
}

export interface UsdtHistoricalRate {
  buy: number;
  sell: number;
  average: number;
  date: string;
}

// ----- App Domain Types -----

export type CurrencyCode = 'USD' | 'EUR' | 'USDT' | 'VES';

export interface CurrencyRate {
  code: CurrencyCode;
  rateToVes: number;
  changePercentage: number;
  lastUpdated: string;
}

export interface UnifiedRates {
  usd: CurrencyRate;
  eur: CurrencyRate;
  usdt: CurrencyRate;
  lastUpdated: Date;
}

export interface ConversionResult {
  from: CurrencyCode;
  to: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  rate: number;
}

/** Normalized data point for charts */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type ChartPeriod = '1d' | '3d' | '7d' | '30d';
