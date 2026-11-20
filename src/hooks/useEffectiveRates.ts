import { useMemo } from 'react';

import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useCustomRateStore } from '@/store/customRateStore';
import {
  buildEffectiveRatesSnapshot,
  buildRateSourceOptions,
  resolveCustomRateValue,
} from '@/utils/customRateUtils';

export function useEffectiveRates() {
  const ratesQuery = useCurrencyRates();
  const customRates = useCustomRateStore((state) => state.customRates);

  const resolvedCustomRates = useMemo(
    () =>
      customRates.map((item) => ({
        item,
        rateToVes: resolveCustomRateValue(item, ratesQuery.rates),
      })),
    [customRates, ratesQuery.rates],
  );

  const enabledCustomRates = useMemo(
    () => resolvedCustomRates.filter((entry) => entry.item.enabled),
    [resolvedCustomRates],
  );

  const snapshot = useMemo(
    () => buildEffectiveRatesSnapshot(ratesQuery.rates, customRates),
    [customRates, ratesQuery.rates],
  );

  const sourceOptions = useMemo(
    () => buildRateSourceOptions(ratesQuery.rates, customRates),
    [customRates, ratesQuery.rates],
  );

  return {
    ...ratesQuery,
    customRates,
    resolvedCustomRates,
    enabledCustomRates,
    snapshot,
    sourceOptions,
  };
}
