import type {
  ApiCurrency,
  ApiRateRecord,
  ApiTodayRateRecord,
  UnifiedRates,
} from '@/types/currency.types';

const pctChange = (current: number, previous?: number) =>
  previous && previous > 0 ? ((current - previous) / previous) * 100 : 0;

function pickLatest(
  todayList: ApiTodayRateRecord[],
  recentList: ApiRateRecord[],
  currency: ApiCurrency,
): ApiTodayRateRecord | ApiRateRecord | undefined {
  return (
    todayList.find((r) => r.currency === currency) ??
    recentList.find((r) => r.currency === currency)
  );
}

function pickPrevious(
  recentList: ApiRateRecord[],
  currency: ApiCurrency,
  currentId?: number,
): ApiRateRecord | undefined {
  return recentList.find(
    (r) => r.currency === currency && r.id !== currentId,
  );
}

export function buildUnifiedRatesFromApi(
  todayRates: ApiTodayRateRecord[],
  recentRates: ApiRateRecord[],
): { rates: UnifiedRates | null; hasBcv: boolean; hasFallback: boolean } {
  const bcvUsd = pickLatest(todayRates, recentRates, 'BCV_USD');
  const bcvEur = pickLatest(todayRates, recentRates, 'BCV_EUR');
  const yadioUsd = pickLatest(todayRates, recentRates, 'YD_USD');

  const usdRate = bcvUsd ? Number(bcvUsd.rate) : 0;
  const eurRate = bcvEur ? Number(bcvEur.rate) : 0;
  const usdtRate = yadioUsd ? Number(yadioUsd.rate) : 0;

  if (usdRate <= 0 && eurRate <= 0 && usdtRate <= 0) {
    return { rates: null, hasBcv: false, hasFallback: false };
  }

  const prevUsd = pickPrevious(recentRates, 'BCV_USD', bcvUsd?.id);
  const prevEur = pickPrevious(recentRates, 'BCV_EUR', bcvEur?.id);
  const prevUsdt = pickPrevious(recentRates, 'YD_USD', yadioUsd?.id);

  const usdFallback = Boolean(
    bcvUsd && 'isFallback' in bcvUsd && bcvUsd.isFallback,
  );
  const eurFallback = Boolean(
    bcvEur && 'isFallback' in bcvEur && bcvEur.isFallback,
  );
  const usdtFallback = Boolean(
    yadioUsd && 'isFallback' in yadioUsd && yadioUsd.isFallback,
  );

  const rates: UnifiedRates = {
    usd: {
      code: 'USD',
      rateToVes: usdRate,
      changePercentage: pctChange(
        usdRate,
        prevUsd ? Number(prevUsd.rate) : undefined,
      ),
      lastUpdated: bcvUsd?.created_at ?? '',
      isFallback: usdFallback,
    },
    eur: {
      code: 'EUR',
      rateToVes: eurRate,
      changePercentage: pctChange(
        eurRate,
        prevEur ? Number(prevEur.rate) : undefined,
      ),
      lastUpdated: bcvEur?.created_at ?? '',
      isFallback: eurFallback,
    },
    usdt: {
      code: 'USDT',
      rateToVes: usdtRate,
      changePercentage: pctChange(
        usdtRate,
        prevUsdt ? Number(prevUsdt.rate) : undefined,
      ),
      lastUpdated: yadioUsd?.created_at ?? '',
      isFallback: usdtFallback,
    },
    lastUpdated: new Date(),
  };

  return {
    rates,
    hasBcv: usdRate > 0 && eurRate > 0,
    hasFallback: usdFallback || eurFallback || usdtFallback,
  };
}
