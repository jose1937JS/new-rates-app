import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { expireApiCache, fetchCurrencyHistory } from '@/services/ratesApi';
import type {
  ChartDataPoint,
  ChartPeriod,
  CurrencyCode,
} from '@/types/currency.types';
import {
  CURRENCY_TO_API,
  GC_TIME,
  queryKeys,
  STALE_TIME,
} from '@/utils/constants';
import { formatChartDate, formatChartTime } from '@/utils/formatters';

function getPeriodDays(period: ChartPeriod): number {
  switch (period) {
    case '1d':
      return 1;
    case '3d':
      return 3;
    case '7d':
      return 7;
    case '30d':
      return 30;
  }
}

export function useHistoricalRates(
  currency: CurrencyCode,
  period: ChartPeriod = '1d',
) {
  const apiCurrency = CURRENCY_TO_API[currency];

  const historyQuery = useQuery({
    queryKey: queryKeys.history(currency),
    queryFn: () => fetchCurrencyHistory(apiCurrency!, 30),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: Boolean(apiCurrency),
  });

  const { data, stats } = useMemo(() => {
    const records = historyQuery.data ?? [];
    if (records.length === 0) {
      return {
        data: [] as ChartDataPoint[],
        stats: { current: 0, max: 0, min: 0, change: 0 },
      };
    }

    const uniqueRecords = Array.from(
      new Map(records.map((r) => [r.id, r])).values(),
    );

    const sorted = [...uniqueRecords].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );

    const days = getPeriodDays(period);
    const cutoffMs = Date.now() - days * 86_400_000;
    let filtered = sorted.filter(
      (r) => new Date(r.created_at).getTime() >= cutoffMs,
    );

    // Fallback for sparse data (e.g. BCV on weekends/holidays)
    const minPoints = period === '1d' ? 2 : period === '3d' ? 3 : 2;
    if (filtered.length < minPoints && sorted.length >= 2) {
      filtered = sorted.slice(-minPoints);
    }

    const dayLabels = filtered.map((r) => formatChartDate(r.created_at));
    const hasIntraday =
      currency === 'USDT' || new Set(dayLabels).size < dayLabels.length;
    const seenDays = new Set<string>();

    const points: ChartDataPoint[] = filtered.map((r, index) => {
      const dayLabel = dayLabels[index];
      const isFirstOfDay = !seenDays.has(dayLabel);
      if (isFirstOfDay) {
        seenDays.add(dayLabel);
      }

      let label: string;
      if (period === '1d' && hasIntraday) {
        label = formatChartTime(r.created_at);
      } else if (isFirstOfDay) {
        label = dayLabel;
      } else if (period === '30d') {
        label = '';
      } else {
        label = formatChartTime(r.created_at);
      }

      return {
        id: r.id,
        date: r.created_at,
        value: Number(r.rate),
        label,
      };
    });

    const values = points.map((d) => d.value);
    const first = values[0] ?? 0;
    const last = values.at(-1) ?? 0;

    return {
      data: points,
      stats: {
        current: last,
        max: values.length ? Math.max(...values) : 0,
        min: values.length ? Math.min(...values) : 0,
        change: first > 0 ? ((last - first) / first) * 100 : 0,
      },
    };
  }, [historyQuery.data, period, currency]);

  const { refetch: queryRefetch } = historyQuery;
  const refetch = useCallback(async () => {
    await expireApiCache();
    return queryRefetch();
  }, [queryRefetch]);

  return {
    data,
    stats,
    isLoading: historyQuery.isLoading && !historyQuery.data,
    isFetching: historyQuery.isFetching,
    isError: historyQuery.isError && !historyQuery.data,
    refetch,
  };
}
