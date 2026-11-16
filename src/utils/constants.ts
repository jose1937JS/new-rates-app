import type { ApiCurrency, CurrencyCode } from '@/types/currency.types';

// ----- API Configuration -----

export const RATES_API_URL = (
  process.env.EXPO_PUBLIC_RATES_API_URL ??
  'https://rates-api.dev-lopezjose.workers.dev'
).replace(/\/+$/, '');

export const RATES_API_KEY = process.env.EXPO_PUBLIC_RATES_API_KEY ?? '';

export const CURRENCY_TO_API: Partial<Record<CurrencyCode, ApiCurrency>> = {
  USD: 'BCV_USD',
  EUR: 'BCV_EUR',
  USDT: 'YD_USD',
};

// ----- Query Keys -----

export const queryKeys = {
  all: ['currency'] as const,
  today: () => [...queryKeys.all, 'today'] as const,
  recent: () => [...queryKeys.all, 'recent'] as const,
  history: (currency: CurrencyCode) =>
    [...queryKeys.all, 'history', currency] as const,
} as const;

// ----- Cache Configuration -----

export const STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const GC_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days
export const PERSIST_KEY = 'ratesvenapp_cache';
export const PERSIST_THROTTLE = 1000; // 1 second
export const API_CACHE_PREFIX = '@ratesvenapp/api_cache:';
export const API_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

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
  USDT: 'USDT (Yadio)',
  VES: 'Bolívar',
};

// ----- Theme -----

export const THEME_COLORS = {
  light: {
    primary: '#ff6b26',
    primaryLight: '#ff8f5a',
    primaryDark: '#cc5520',
    surface: '#f9fafb',
    surfaceCard: '#ffffff',
    surfaceElevated: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    success: '#22c55e',
    danger: '#ef4444',
    border: '#e5e7eb',
  },
  dark: {
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
  },
} as const;

// ----- App -----

export const APP_NAME = 'RatesVenApp';
export const APP_VERSION = '1.0.0';
