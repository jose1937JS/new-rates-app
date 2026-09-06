import { useQueries } from '@tanstack/react-query';

import { fetchBcvCurrent, fetchUsdtRate } from '@/services/dolarVzlaApi';
import type { UnifiedRates } from '@/types/currency.types';
import { queryKeys, STALE_TIME, GC_TIME } from '@/utils/constants';

export function useCurrencyRates() {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.bcvCurrent(),
        queryFn: fetchBcvCurrent,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      {
        queryKey: queryKeys.usdtCurrent(),
        queryFn: fetchUsdtRate,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
    ],
  });

  const [bcvQuery, usdtQuery] = results;
  const isLoading = bcvQuery.isLoading || usdtQuery.isLoading;
  const isError = bcvQuery.isError || usdtQuery.isError;
  const isFetching = bcvQuery.isFetching || usdtQuery.isFetching;

  let rates: UnifiedRates | null = null;

  if (bcvQuery.data && usdtQuery.data) {
    const bcv = bcvQuery.data;
    const usdt = usdtQuery.data;

    rates = {
      usd: {
        code: 'USD',
        rateToVes: bcv.current.usd,
        changePercentage: bcv.changePercentage.usd,
        lastUpdated: bcv.current.date,
      },
      eur: {
        code: 'EUR',
        rateToVes: bcv.current.eur,
        changePercentage: bcv.changePercentage.eur,
        lastUpdated: bcv.current.date,
      },
      usdt: {
        code: 'USDT',
        rateToVes: usdt.current.average,
        changePercentage: usdt.changePercentage.average,
        lastUpdated: usdt.current.date,
      },
      lastUpdated: new Date(),
    };
  }

  return {
    rates,
    isLoading,
    isError,
    isFetching,
    bcvError: bcvQuery.error,
    usdtError: usdtQuery.error,
    dataUpdatedAt: Math.max(
      bcvQuery.dataUpdatedAt ?? 0,
      usdtQuery.dataUpdatedAt ?? 0,
    ),
  };
}
