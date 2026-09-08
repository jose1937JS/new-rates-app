import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

import { fetchBcvMonthly, fetchUsdtHistory } from '@/services/dolarVzlaApi';
import type {
  ChartDataPoint,
  ChartPeriod,
  CurrencyCode,
} from '@/types/currency.types';
import { queryKeys, STALE_TIME, GC_TIME } from '@/utils/constants';

function getDateRange(period: ChartPeriod) {
  const to = new Date();
  let days = 30;
  if (period === '1d') days = 1;
  else if (period === '3d') days = 3;
  else if (period === '7d') days = 7;

  const from = subDays(to, days);
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
    fromDate: from,
    toDate: to,
  };
}

export function useHistoricalRates(
  currency: CurrencyCode,
  period: ChartPeriod = '1d',
) {
  const { from, to, fromDate, toDate } = getDateRange(period);

  // BCV historical — fetch monthly data for the months in range
  const bcvQuery = useQuery({
    queryKey: queryKeys.bcvMonthly(toDate.getFullYear(), toDate.getMonth() + 1),
    queryFn: () =>
      fetchBcvMonthly(toDate.getFullYear(), toDate.getMonth() + 1),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: currency === 'USD' || currency === 'EUR',
  });

  // Also fetch previous month if the range crosses month boundary
  const needsPrevMonth = fromDate.getMonth() !== toDate.getMonth();
  const prevMonthQuery = useQuery({
    queryKey: queryKeys.bcvMonthly(
      fromDate.getFullYear(),
      fromDate.getMonth() + 1,
    ),
    queryFn: () =>
      fetchBcvMonthly(fromDate.getFullYear(), fromDate.getMonth() + 1),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: needsPrevMonth && (currency === 'USD' || currency === 'EUR'),
  });

  // USDT historical
  const usdtQuery = useQuery({
    queryKey: queryKeys.usdtHistory(from, to),
    queryFn: () => fetchUsdtHistory(from, to),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: currency === 'USDT',
  });

  const isLoading =
    (currency === 'USDT' && usdtQuery.isLoading) ||
    ((currency === 'USD' || currency === 'EUR') && bcvQuery.isLoading);

  let data: ChartDataPoint[] = [];

  if (currency === 'USDT' && usdtQuery.data) {
    data = usdtQuery.data.rates
      .map((r) => ({
        date: r.date,
        value: r.average,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } else if ((currency === 'USD' || currency === 'EUR') && bcvQuery.data) {
    const allRates = [
      ...bcvQuery.data,
      ...(needsPrevMonth && prevMonthQuery.data ? prevMonthQuery.data : []),
    ];

    const field = currency === 'USD' ? 'usd' : 'eur';
    const sortedRates = allRates
      .filter((r) => r[field] != null)
      .sort((a, b) => a.date.localeCompare(b.date));

    let filtered = sortedRates.filter((r) => r.date >= from && r.date <= to);

    // If filtered points are insufficient (e.g. on weekends for 1d/3d), fallback to the last N points
    const minPoints = period === '1d' ? 2 : period === '3d' ? 3 : 2;
    if (filtered.length < minPoints && sortedRates.length >= 2) {
      filtered = sortedRates.slice(-minPoints);
    }

    data = filtered.map((r) => ({
      date: r.date,
      value: r[field],
    }));
  }

  // Compute stats
  const values = data.map((d) => d.value);
  const stats = {
    current: values.at(-1) ?? 0,
    max: values.length ? Math.max(...values) : 0,
    min: values.length ? Math.min(...values) : 0,
    change:
      values.length >= 2
        ? (((values.at(-1)! - values[0]!) / values[0]!) * 100)
        : 0,
  };

  return { data, stats, isLoading };
}
