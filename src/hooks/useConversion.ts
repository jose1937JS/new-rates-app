import { useMemo } from 'react';

import type { CurrencyCode, UnifiedRates } from '@/types/currency.types';

export interface ConversionMap {
  USD: number;
  EUR: number;
  USDT: number;
  VES: number;
}

const ZERO_CONVERSIONS: ConversionMap = { USD: 0, EUR: 0, USDT: 0, VES: 0 };

/** Convert a numeric amount from one currency to all supported currencies. */
export function convertAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  rates: UnifiedRates | null,
): ConversionMap {
  if (!rates || amount === 0) return ZERO_CONVERSIONS;

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

  return {
    VES: amountInVes,
    USD: rates.usd.rateToVes > 0 ? amountInVes / rates.usd.rateToVes : 0,
    EUR: rates.eur.rateToVes > 0 ? amountInVes / rates.eur.rateToVes : 0,
    USDT: rates.usdt.rateToVes > 0 ? amountInVes / rates.usdt.rateToVes : 0,
  };
}

/**
 * Pure conversion hook.
 * Given an amount in a source currency and the unified rates,
 * returns the equivalent in all currencies.
 */
export function useConversion(
  amount: number,
  fromCurrency: CurrencyCode,
  rates: UnifiedRates | null,
): ConversionMap {
  return useMemo(
    () => convertAmount(amount, fromCurrency, rates),
    [amount, fromCurrency, rates],
  );
}
