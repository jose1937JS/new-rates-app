import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  expireApiCache,
  fetchRecentRates,
  fetchTodayRates,
} from '@/services/ratesApi';
import type {
  ApiCurrency,
  ApiRateRecord,
  ApiTodayRateRecord,
  UnifiedRates,
} from '@/types/currency.types';
import { GC_TIME, queryKeys, STALE_TIME } from '@/utils/constants';

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

export function useCurrencyRates() {
  const [todayQuery, recentQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.today(),
        queryFn: () => fetchTodayRates(),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
      },
      {
        queryKey: queryKeys.recent(),
        queryFn: () => fetchRecentRates(),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
      },
    ],
  });

  const isLoading = todayQuery.isLoading && !todayQuery.data;
  const isFetching = todayQuery.isFetching || recentQuery.isFetching;
  const isError = todayQuery.isError && !todayQuery.data;
  const error = (todayQuery.error ?? recentQuery.error) as Error | null;

  const computed = useMemo(() => {
    const todayRates = todayQuery.data?.rates ?? [];
    const recentRates = recentQuery.data?.rates ?? [];

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

    const usdFallback = Boolean(bcvUsd && 'isFallback' in bcvUsd && bcvUsd.isFallback);
    const eurFallback = Boolean(bcvEur && 'isFallback' in bcvEur && bcvEur.isFallback);
    const usdtFallback = Boolean(yadioUsd && 'isFallback' in yadioUsd && yadioUsd.isFallback);

    const rates: UnifiedRates = {
      usd: {
        code: 'USD',
        rateToVes: usdRate,
        changePercentage: pctChange(usdRate, prevUsd ? Number(prevUsd.rate) : undefined),
        lastUpdated: bcvUsd?.created_at ?? '',
        isFallback: usdFallback,
      },
      eur: {
        code: 'EUR',
        rateToVes: eurRate,
        changePercentage: pctChange(eurRate, prevEur ? Number(prevEur.rate) : undefined),
        lastUpdated: bcvEur?.created_at ?? '',
        isFallback: eurFallback,
      },
      usdt: {
        code: 'USDT',
        rateToVes: usdtRate,
        changePercentage: pctChange(usdtRate, prevUsdt ? Number(prevUsdt.rate) : undefined),
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
  }, [todayQuery.data, recentQuery.data]);

  const { refetch: refetchToday } = todayQuery;
  const { refetch: refetchRecent } = recentQuery;

  const refetch = useCallback(async () => {
    await expireApiCache();
    return Promise.all([refetchToday(), refetchRecent()]);
  }, [refetchToday, refetchRecent]);

  return {
    ...computed,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
    dataUpdatedAt: Math.max(
      todayQuery.dataUpdatedAt ?? 0,
      recentQuery.dataUpdatedAt ?? 0,
    ),
  };
}
