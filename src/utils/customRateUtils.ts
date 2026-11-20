import type {
  CurrencyCode,
  CustomRateItem,
  CustomRateRounding,
  EffectiveRatesSnapshot,
  RateSourceId,
  UnifiedRates,
} from '@/types/currency.types';

export const CUSTOM_RATE_EMOJI_PRESETS = [
  '🏪',
  '🛍️',
  '💳',
  '💵',
  '🏦',
  '🛵',
  '🧾',
  '⚖️',
  '🏷️',
  '🛒',
  '💎',
  '⭐',
] as const;

export const CUSTOM_RATE_ROUNDING_OPTIONS: Array<{
  value: CustomRateRounding;
  label: string;
}> = [
  { value: 0, label: 'Exacto' },
  { value: 0.5, label: '0,50 Bs' },
  { value: 1, label: '1 Bs' },
  { value: 5, label: '5 Bs' },
  { value: 10, label: '10 Bs' },
];

export interface RateSourceOption {
  id: RateSourceId;
  label: string;
  shortLabel: string;
  emoji?: string;
  rateToVes: number;
  available: boolean;
  isCustom: boolean;
}

export function applyCustomRateRounding(
  rate: number,
  rounding: CustomRateRounding,
): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  if (!rounding || rounding <= 0) {
    return Math.round(rate * 100) / 100;
  }
  const rounded = Math.ceil((rate - 1e-9) / rounding) * rounding;
  return Math.round(rounded * 100) / 100;
}

export function resolveCustomRateValue(
  item: CustomRateItem,
  rates: UnifiedRates | null,
): number {
  let raw = 0;

  if (item.mode === 'fixed') {
    raw = item.fixedRate && item.fixedRate > 0 ? item.fixedRate : 0;
  } else if (rates) {
    const usd = rates.usd.rateToVes;
    const eur = rates.eur.rateToVes;
    const usdt = rates.usdt.rateToVes;

    if (item.mode === 'average') {
      if (usd > 0 && usdt > 0) {
        raw = (usd + usdt) / 2;
      } else {
        raw = usd > 0 ? usd : usdt;
      }
    } else if (item.mode === 'margin') {
      const baseRate =
        item.base === 'BCV_EUR' ? eur : item.base === 'USDT' ? usdt : usd;
      raw = baseRate > 0 ? baseRate * (1 + item.marginPercent / 100) : 0;
    }
  }

  return applyCustomRateRounding(raw, item.rounding);
}

export function buildEffectiveRatesSnapshot(
  rates: UnifiedRates | null,
  customRates: CustomRateItem[],
): EffectiveRatesSnapshot {
  const activeCustom = customRates
    .filter((item) => item.enabled)
    .map((item) => ({
      id: item.id,
      emoji: item.emoji,
      label: item.label,
      rateToVes: resolveCustomRateValue(item, rates),
    }))
    .filter((item) => item.rateToVes > 0);

  return {
    usdToVes: rates?.usd.rateToVes ?? 0,
    eurToVes: rates?.eur.rateToVes ?? 0,
    usdtToVes: rates?.usdt.rateToVes ?? 0,
    customRates: activeCustom,
  };
}

export function buildRateSourceOptions(
  rates: UnifiedRates | null,
  customRates: CustomRateItem[],
): RateSourceOption[] {
  const options: RateSourceOption[] = [
    {
      id: 'BCV_USD',
      label: 'BCV Dólar',
      shortLabel: 'BCV $',
      rateToVes: rates?.usd.rateToVes ?? 0,
      available: (rates?.usd.rateToVes ?? 0) > 0,
      isCustom: false,
    },
    {
      id: 'BCV_EUR',
      label: 'BCV Euro',
      shortLabel: 'BCV €',
      rateToVes: rates?.eur.rateToVes ?? 0,
      available: (rates?.eur.rateToVes ?? 0) > 0,
      isCustom: false,
    },
    {
      id: 'USDT',
      label: 'USDT Yadio',
      shortLabel: 'USDT',
      rateToVes: rates?.usdt.rateToVes ?? 0,
      available: (rates?.usdt.rateToVes ?? 0) > 0,
      isCustom: false,
    },
  ];

  for (const item of customRates) {
    if (!item.enabled) continue;
    const rateToVes = resolveCustomRateValue(item, rates);
    options.push({
      id: `CUSTOM:${item.id}`,
      label: item.label,
      shortLabel: item.label,
      emoji: item.emoji,
      rateToVes,
      available: rateToVes > 0,
      isCustom: true,
    });
  }

  return options;
}

export function getRateForSource(
  sourceId: RateSourceId,
  snapshot: EffectiveRatesSnapshot,
): { rateToVes: number; label: string; emoji?: string } {
  if (sourceId === 'BCV_EUR') {
    return { rateToVes: snapshot.eurToVes, label: 'BCV Euro' };
  }
  if (sourceId === 'USDT') {
    return { rateToVes: snapshot.usdtToVes, label: 'USDT Yadio' };
  }
  if (sourceId.startsWith('CUSTOM:')) {
    const customId = sourceId.slice('CUSTOM:'.length);
    const match = snapshot.customRates.find((c) => c.id === customId);
    if (match) {
      return {
        rateToVes: match.rateToVes,
        label: match.label,
        emoji: match.emoji,
      };
    }
  }
  return { rateToVes: snapshot.usdToVes, label: 'BCV Dólar' };
}

/** Convert an amount from any CurrencyCode to all 4 currencies using a chosen USD-based rate source when custom, or official snapshot otherwise. */
export function convertWithRateSource(
  amount: number,
  fromCurrency: CurrencyCode,
  sourceId: RateSourceId,
  snapshot: EffectiveRatesSnapshot,
): { USD: number; EUR: number; USDT: number; VES: number } {
  if (!amount || !Number.isFinite(amount)) {
    return { USD: 0, EUR: 0, USDT: 0, VES: 0 };
  }

  const chosen = getRateForSource(sourceId, snapshot);
  const customRate = sourceId.startsWith('CUSTOM:') ? chosen.rateToVes : 0;

  // Use chosen custom rate for VES <-> USD conversions; fall back to snapshot for EUR/USDT
  const effectiveUsdRate = customRate > 0 ? customRate : snapshot.usdToVes;
  const effectiveEurRate =
    sourceId === 'BCV_EUR' && snapshot.eurToVes > 0
      ? snapshot.eurToVes
      : snapshot.eurToVes;
  const effectiveUsdtRate =
    sourceId === 'USDT' && snapshot.usdtToVes > 0
      ? snapshot.usdtToVes
      : snapshot.usdtToVes;

  let amountInVes = 0;
  switch (fromCurrency) {
    case 'VES':
      amountInVes = amount;
      break;
    case 'USD':
      amountInVes = amount * (sourceId === 'BCV_EUR' ? snapshot.usdToVes : chosen.rateToVes || snapshot.usdToVes);
      break;
    case 'EUR':
      amountInVes = amount * (effectiveEurRate || chosen.rateToVes);
      break;
    case 'USDT':
      amountInVes = amount * (customRate > 0 ? customRate : effectiveUsdtRate);
      break;
  }

  return {
    VES: amountInVes,
    USD:
      (sourceId === 'BCV_USD' || customRate > 0 ? effectiveUsdRate : chosen.rateToVes || effectiveUsdRate) > 0
        ? amountInVes / (customRate > 0 ? customRate : chosen.rateToVes || effectiveUsdRate)
        : 0,
    EUR: effectiveEurRate > 0 ? amountInVes / effectiveEurRate : 0,
    USDT: effectiveUsdtRate > 0 ? amountInVes / effectiveUsdtRate : 0,
  };
}
