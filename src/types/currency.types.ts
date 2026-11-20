// ----- Rates Cloudflare API Types -----

export type ApiCurrency = 'BCV_USD' | 'BCV_EUR' | 'YD_USD';
export type RateSource = 'BCV' | 'YADIO';
export type SyncSource = 'all' | 'bcv' | 'yadio';

export interface ApiRateRecord {
  id: number;
  rate: number;
  currency: ApiCurrency;
  name: string;
  source: RateSource;
  created_at: string;
}

export interface ApiTodayRateRecord extends ApiRateRecord {
  isFallback: boolean;
}

export interface ApiPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ApiTodayRatesResponse {
  rates: ApiTodayRateRecord[];
}

export interface ApiPaginatedRatesResponse {
  rates: ApiRateRecord[];
  pagination: ApiPaginationMeta;
}

export interface ApiSingleRateResponse {
  rate: ApiRateRecord;
}

export interface ApiSyncRateItem {
  rate: number;
  currency: ApiCurrency;
  name: string;
  source: RateSource;
}

export interface ApiSyncResponse {
  source: SyncSource;
  syncedCount: number;
  rates: ApiSyncRateItem[];
  durationMs: number;
}

// ----- App Domain Types -----

export type CurrencyCode = 'USD' | 'EUR' | 'USDT' | 'VES';

export interface CurrencyRate {
  code: CurrencyCode;
  rateToVes: number;
  changePercentage: number;
  lastUpdated: string;
  isFallback?: boolean;
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
  id?: number;
  date: string;
  value: number;
  label?: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type PrimaryColorId =
  | 'orange'
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'gold';

export interface PrimaryColorOption {
  id: PrimaryColorId;
  label: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  rgb: string;
  rgbLight: string;
  rgbDark: string;
}

export type ChartPeriod = '1d' | '3d' | '7d' | '30d';

// ----- Shopping Calculator Types -----

export interface ShoppingRatesSnapshot {
  usdToVes: number;
  eurToVes: number;
  usdtToVes: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  unitPrice: number;
  currency: CurrencyCode;
  quantity: number;
  createdAt: string;
}

export type ShoppingListStatus = 'active' | 'completed';

export interface ShoppingList {
  id: string;
  title: string;
  status: ShoppingListStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  displayCurrency: CurrencyCode;
  defaultInputCurrency: CurrencyCode;
  budgetLimit?: number;
  budgetCurrency: CurrencyCode;
  actualPaidAmount?: number;
  actualPaidCurrency: CurrencyCode;
  ratesSnapshot: ShoppingRatesSnapshot;
  items: ShoppingItem[];
}

// ----- Custom Rates & Fiscal Settings -----

export type CustomRateMode = 'fixed' | 'average' | 'margin';
export type CustomRateBase = 'BCV_USD' | 'BCV_EUR' | 'USDT';
export type CustomRateRounding = 0 | 0.5 | 1 | 5 | 10;

export interface CustomRateItem {
  id: string;
  emoji: string;
  label: string;
  enabled: boolean;
  mode: CustomRateMode;
  fixedRate?: number;
  base: CustomRateBase;
  marginPercent: number;
  rounding: CustomRateRounding;
  createdAt: string;
  updatedAt: string;
}

export type RateSourceId = 'BCV_USD' | 'BCV_EUR' | 'USDT' | `CUSTOM:${string}`;

export interface EffectiveRatesSnapshot extends ShoppingRatesSnapshot {
  customRates: Array<{
    id: string;
    emoji: string;
    label: string;
    rateToVes: number;
  }>;
}

export interface FiscalSettings {
  ivaPercent: number;
  igtfPercent: number;
}

// ----- Payment Templates -----

export type PaymentMethodType =
  | 'pago_movil'
  | 'transferencia'
  | 'binance'
  | 'zelle'
  | 'otro';

export type IdDocPrefix = 'V' | 'E' | 'J' | 'G' | 'P';

interface PaymentTemplateBase {
  id: string;
  alias: string;
  type: PaymentMethodType;
  holderName?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentTemplate =
  | (PaymentTemplateBase & {
      type: 'pago_movil';
      bankCode: string;
      phone: string;
      idPrefix: IdDocPrefix;
      idNumber: string;
    })
  | (PaymentTemplateBase & {
      type: 'transferencia';
      bankCode: string;
      accountNumber: string;
      idPrefix: IdDocPrefix;
      idNumber: string;
    })
  | (PaymentTemplateBase & {
      type: 'binance';
      payId?: string;
      email?: string;
      username?: string;
    })
  | (PaymentTemplateBase & {
      type: 'zelle';
      email: string;
    })
  | (PaymentTemplateBase & {
      type: 'otro';
      freeText: string;
    });

// ----- Bill Splitter -----

export interface SplitPerson {
  id: string;
  name: string;
  customAmount?: number;
  paid: boolean;
  paidAt?: string;
}

export type SplitTipMode = 'none' | 'percent' | 'fixed';

export interface BillSplit {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  currency: CurrencyCode;
  tipMode: SplitTipMode;
  tipValue: number;
  rateSource: RateSourceId;
  ratesSnapshot: EffectiveRatesSnapshot;
  people: SplitPerson[];
}
