import type {
  CurrencyCode,
  EffectiveRatesSnapshot,
  FiscalSettings,
  RateSourceId,
} from '@/types/currency.types';
import { getRateForSource } from '@/utils/customRateUtils';

export interface FiscalBreakdown {
  baseAmount: number;
  ivaAmount: number;
  igtfAmount: number;
  totalAmount: number;
  multiplier: number;
}

/**
 * Compute sequential fiscal taxes in Venezuela:
 * 1) IVA (e.g. 16%) on base amount
 * 2) IGTF (e.g. 3%) on the subtotal when applicable
 */
export function computeFiscalBreakdown(
  baseAmount: number,
  options: { ivaActive: boolean; igtfActive: boolean },
  settings: FiscalSettings,
): FiscalBreakdown {
  const ivaRate = options.ivaActive ? Math.max(0, settings.ivaPercent) / 100 : 0;
  const igtfRate = options.igtfActive
    ? Math.max(0, settings.igtfPercent) / 100
    : 0;

  const ivaAmount = baseAmount * ivaRate;
  const subtotal = baseAmount + ivaAmount;
  const igtfAmount = subtotal * igtfRate;
  const totalAmount = subtotal + igtfAmount;
  const multiplier = (1 + ivaRate) * (1 + igtfRate);

  return {
    baseAmount,
    ivaAmount,
    igtfAmount,
    totalAmount,
    multiplier,
  };
}

export interface CashForeignEntry {
  id: string;
  amount: number;
  currency: Exclude<CurrencyCode, 'VES'>;
}

export interface MixedPaymentResult {
  referenceRateToVes: number;
  referenceLabel: string;
  totalVes: number;
  totalUsdEquivalent: number;
  cashVes: number;
  igtfVes: number;
  grandTotalVes: number;
  remainingVes: number;
  remainingInRefUsd: number;
  changeVes: number;
  changeInRefUsd: number;
  isFullyCovered: boolean;
}

export function computeMixedPayment({
  totalAmount,
  totalCurrency,
  rateSource,
  snapshot,
  cashEntries,
  applyIgtf,
  igtfPercent,
}: {
  totalAmount: number;
  totalCurrency: CurrencyCode;
  rateSource: RateSourceId;
  snapshot: EffectiveRatesSnapshot;
  cashEntries: CashForeignEntry[];
  applyIgtf: boolean;
  igtfPercent: number;
}): MixedPaymentResult {
  const source = getRateForSource(rateSource, snapshot);
  const refRate = source.rateToVes > 0 ? source.rateToVes : snapshot.usdToVes;

  const getRateForForeign = (code: Exclude<CurrencyCode, 'VES'>): number => {
    if (code === 'EUR') {
      return rateSource === 'BCV_EUR' && refRate > 0
        ? refRate
        : snapshot.eurToVes || refRate;
    }
    if (code === 'USDT') {
      return rateSource.startsWith('CUSTOM:') && refRate > 0
        ? refRate
        : snapshot.usdtToVes || refRate;
    }
    return refRate;
  };

  let totalVes = 0;
  if (totalAmount > 0) {
    if (totalCurrency === 'VES') {
      totalVes = totalAmount;
    } else {
      totalVes = totalAmount * getRateForForeign(totalCurrency);
    }
  }

  const cashVes = cashEntries.reduce((sum, entry) => {
    if (!Number.isFinite(entry.amount) || entry.amount <= 0) return sum;
    return sum + entry.amount * getRateForForeign(entry.currency);
  }, 0);

  // IGTF (3%) applies ONLY to the portion paid in foreign currency cash
  const igtfVes =
    applyIgtf && cashVes > 0 ? cashVes * (Math.max(0, igtfPercent) / 100) : 0;

  const grandTotalVes = totalVes + igtfVes;
  const diff = grandTotalVes - cashVes;
  const remainingVes = Math.max(0, diff);
  const changeVes = Math.max(0, -diff);

  return {
    referenceRateToVes: refRate,
    referenceLabel: source.label,
    totalVes,
    totalUsdEquivalent: refRate > 0 ? totalVes / refRate : 0,
    cashVes,
    igtfVes,
    grandTotalVes,
    remainingVes,
    remainingInRefUsd: refRate > 0 ? remainingVes / refRate : 0,
    changeVes,
    changeInRefUsd: refRate > 0 ? changeVes / refRate : 0,
    isFullyCovered: diff <= 0.005 && totalVes > 0,
  };
}
