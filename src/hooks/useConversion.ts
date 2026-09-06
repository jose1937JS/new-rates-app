import { useMemo } from 'react';

import type { CurrencyCode, UnifiedRates } from '@/types/currency.types';

interface ConversionMap {
  USD: number;
  EUR: number;
  USDT: number;
  VES: number;
}

/**
 * Pure conversion logic.
 * Given an amount in a source currency and the unified rates,
 * returns the equivalent in all other currencies.
 */
export function useConversion(
  amount: number,
  fromCurrency: CurrencyCode,
  rates: UnifiedRates | null,
): ConversionMap {
  return useMemo(() => {
    const zero: ConversionMap = { USD: 0, EUR: 0, USDT: 0, VES: 0 };
    if (!rates || amount === 0) return zero;

    // First convert to VES (the common denominator)
    let amountInVes: number;

    switch (fromCurrency) {
      case 'VES':
        amountInVes = amount;
        break;
      case 'USD':
        amountInVes = amount * rates.usd.rateToVes;
        break;
      case 'EUR':
        amountInVes = amount * rates.eur.rateToVes;
        break;
      case 'USDT':
        amountInVes = amount * rates.usdt.rateToVes;
        break;
    }

    // Then convert from VES to all currencies
    return {
      VES: amountInVes,
      USD: rates.usd.rateToVes > 0 ? amountInVes / rates.usd.rateToVes : 0,
      EUR: rates.eur.rateToVes > 0 ? amountInVes / rates.eur.rateToVes : 0,
      USDT: rates.usdt.rateToVes > 0 ? amountInVes / rates.usdt.rateToVes : 0,
    };
  }, [amount, fromCurrency, rates]);
}
