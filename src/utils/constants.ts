import Constants from 'expo-constants';

import type {
  ApiCurrency,
  CurrencyCode,
  PrimaryColorOption,
} from '@/types/currency.types';

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
  USDT: '₮',
  VES: '🇻🇪',
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: 'Dólar americano',
  EUR: 'Euro',
  USDT: 'USDT (Yadio)',
  VES: 'Bolívar',
};

// ----- Theme -----

export const DEFAULT_PRIMARY_COLOR = '#ff6b26';

export const PRIMARY_COLOR_OPTIONS: PrimaryColorOption[] = [
  {
    id: 'orange',
    label: 'Naranja',
    primary: '#ff6b26',
    primaryLight: '#ff8f5a',
    primaryDark: '#b84514',
    rgb: '255 107 38',
    rgbLight: '255 143 90',
    rgbDark: '184 69 20',
  },
  {
    id: 'blue',
    label: 'Azul',
    primary: '#2563eb',
    primaryLight: '#60a5fa',
    primaryDark: '#1e40af',
    rgb: '37 99 235',
    rgbLight: '96 165 250',
    rgbDark: '30 64 175',
  },
  {
    id: 'emerald',
    label: 'Esmeralda',
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#047857',
    rgb: '16 185 129',
    rgbLight: '52 211 153',
    rgbDark: '4 120 87',
  },
  {
    id: 'violet',
    label: 'Violeta',
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    rgb: '124 58 237',
    rgbLight: '167 139 250',
    rgbDark: '91 33 182',
  },
  {
    id: 'rose',
    label: 'Carmesí',
    primary: '#e11d48',
    primaryLight: '#fb7185',
    primaryDark: '#9f1239',
    rgb: '225 29 72',
    rgbLight: '251 113 133',
    rgbDark: '159 18 57',
  },
  {
    id: 'teal',
    label: 'Turquesa',
    primary: '#0d9488',
    primaryLight: '#2dd4bf',
    primaryDark: '#115e59',
    rgb: '13 148 136',
    rgbLight: '45 212 191',
    rgbDark: '17 94 89',
  },
];

export const THEME_COLORS = {
  light: {
    primary: '#ff6b26',
    primaryLight: '#ff8f5a',
    primaryDark: '#b84514',
    surface: '#f7f7f7',
    surfaceCard: '#ffffff',
    surfaceElevated: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    success: '#22c55e',
    danger: '#ef4444',
    border: '#f2f2f2',
  },
  dark: {
    primary: '#b84514',
    primaryLight: '#ff6b26',
    primaryDark: '#b84514',
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

export const APP_NAME = Constants.expoConfig?.name ?? 'RatesVenApp';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.1';
