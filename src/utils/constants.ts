import type { CurrencyCode } from '@/types/currency.types';

// ----- API Configuration -----

export const RATES_CDN_URL =
  process.env.EXPO_PUBLIC_RATES_CDN_URL ?? 'https://rates.dolarvzla.com';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.dolarvzla.com';

export const API_KEY =
  process.env.EXPO_PUBLIC_DOLARVZLA_API_KEY ?? '';

export const AUTH_HEADERS = {
  'x-dolarvzla-key': API_KEY,
} as const;

// ----- Query Keys -----

export const queryKeys = {
  all: ['currency'] as const,
  bcv: () => [...queryKeys.all, 'bcv'] as const,
  bcvCurrent: () => [...queryKeys.bcv(), 'current'] as const,
  bcvMonthly: (year: number, month: number) =>
    [...queryKeys.bcv(), 'monthly', year, month] as const,
  usdt: () => [...queryKeys.all, 'usdt'] as const,
  usdtCurrent: () => [...queryKeys.usdt(), 'current'] as const,
  usdtHistory: (from: string, to: string) =>
    [...queryKeys.usdt(), 'history', from, to] as const,
} as const;

// ----- Cache Configuration -----

export const STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const GC_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days
export const PERSIST_KEY = 'ratesvenapp_cache';
export const PERSIST_THROTTLE = 1000; // 1 second

// ----- Currency Metadata -----

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  USDT: '₮',
  VES: 'Bs',
};

export const CURRENCY_FLAGS: Record<CurrencyCode, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  USDT: '💲',
  VES: '🇻🇪',
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: 'Dólar americano',
  EUR: 'Euro',
  USDT: 'Tether (USDT)',
  VES: 'Bolívar',
};

// ----- Theme -----

export const COLORS = {
  primary: '#ff6b26',
  primaryLight: '#ff8f5a',
  primaryDark: '#cc5520',
  surface: '#1a1a1a',
  surfaceCard: '#242424',
  surfaceElevated: '#2e2e2e',
  textPrimary: '#f5f5f5',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  success: '#22c55e',
  danger: '#ef4444',
  border: '#333333',
} as const;

// ----- App -----

export const APP_NAME = 'RatesVenApp';
export const APP_VERSION = '1.0.0';
