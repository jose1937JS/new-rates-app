import { useIsRestoring, useQueries } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import {
  expireApiCache,
  fetchRecentRates,
  fetchTodayRates,
} from '@/services/ratesApi';
import { GC_TIME, queryKeys, STALE_TIME } from '@/utils/constants';
import { buildUnifiedRatesFromApi } from '@/utils/ratesTransform';
import { syncWidgetsWithRates } from '@/widgets/widgetTaskHandler';

export function useCurrencyRates() {
  const isRestoring = useIsRestoring();
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

  const isLoading = isRestoring || (todayQuery.isLoading && !todayQuery.data);
  const isFetching = todayQuery.isFetching || recentQuery.isFetching;
  const isError = !isRestoring && todayQuery.isError && !todayQuery.data;
  const error = (todayQuery.error ?? recentQuery.error) as Error | null;

  const computed = useMemo(
    () =>
      buildUnifiedRatesFromApi(
        todayQuery.data?.rates ?? [],
        recentQuery.data?.rates ?? [],
      ),
    [todayQuery.data, recentQuery.data],
  );

  useEffect(() => {
    if (Platform.OS === 'android' && computed.rates) {
      void syncWidgetsWithRates(computed.rates);
    }
  }, [computed.rates]);

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
