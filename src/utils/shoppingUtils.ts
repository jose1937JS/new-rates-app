import type { ConversionMap } from '@/hooks/useConversion';
import type {
  CurrencyCode,
  ShoppingItem,
  ShoppingList,
  ShoppingRatesSnapshot,
  UnifiedRates,
} from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { formatNumber } from '@/utils/formatters';

const ZERO_MAP: ConversionMap = { USD: 0, EUR: 0, USDT: 0, VES: 0 };

/** Extract numeric VES conversion rates from UnifiedRates */
export function snapshotFromUnifiedRates(
  rates: UnifiedRates | null,
): ShoppingRatesSnapshot {
  return {
    usdToVes: rates?.usd.rateToVes ?? 0,
    eurToVes: rates?.eur.rateToVes ?? 0,
    usdtToVes: rates?.usdt.rateToVes ?? 0,
  };
}

/** Convert an amount from any currency to all 4 currencies using a rates snapshot */
export function convertShoppingAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  snapshot: ShoppingRatesSnapshot,
): ConversionMap {
  if (!Number.isFinite(amount) || amount === 0) {
    return ZERO_MAP;
  }

  let amountInVes: number;
  switch (fromCurrency) {
    case 'VES':
      amountInVes = amount;
      break;
    case 'USD':
      amountInVes = amount * snapshot.usdToVes;
      break;
    case 'EUR':
      amountInVes = amount * snapshot.eurToVes;
      break;
    case 'USDT':
      amountInVes = amount * snapshot.usdtToVes;
      break;
  }

  return {
    VES: amountInVes,
    USD: snapshot.usdToVes > 0 ? amountInVes / snapshot.usdToVes : 0,
    EUR: snapshot.eurToVes > 0 ? amountInVes / snapshot.eurToVes : 0,
    USDT: snapshot.usdtToVes > 0 ? amountInVes / snapshot.usdtToVes : 0,
  };
}

/** Compute subtotal of a single item in a target display currency */
export function getItemSubtotal(
  item: Pick<ShoppingItem, 'unitPrice' | 'quantity' | 'currency'>,
  targetCurrency: CurrencyCode,
  snapshot: ShoppingRatesSnapshot,
): number {
  const nativeTotal = item.unitPrice * item.quantity;
  if (item.currency === targetCurrency) {
    return nativeTotal;
  }
  return convertShoppingAmount(nativeTotal, item.currency, snapshot)[
    targetCurrency
  ];
}

/** Compute cumulative totals across all items in all 4 currencies */
export function getListTotals(list: ShoppingList): ConversionMap {
  if (list.items.length === 0) {
    return ZERO_MAP;
  }

  let totalVes = 0;
  for (const item of list.items) {
    totalVes += convertShoppingAmount(
      item.unitPrice * item.quantity,
      item.currency,
      list.ratesSnapshot,
    ).VES;
  }

  return convertShoppingAmount(totalVes, 'VES', list.ratesSnapshot);
}

/** Format an amount cleanly with its currency symbol/suffix */
export function formatShoppingMoney(
  amount: number,
  currency: CurrencyCode,
): string {
  const formatted = formatNumber(amount, 2);
  if (currency === 'VES') {
    return `${formatted} Bs`;
  }
  if (currency === 'USDT') {
    return `${formatted} USDT`;
  }
  return `${CURRENCY_SYMBOLS[currency]}${formatted}`;
}

export interface BudgetEvaluation {
  hasBudget: boolean;
  limitInDisplay: number;
  totalInDisplay: number;
  remainingInDisplay: number;
  percentageUsed: number;
  status: 'ok' | 'warning' | 'exceeded';
}

/** Evaluate current spend against optional budget limit */
export function evaluateBudget(
  totals: ConversionMap,
  budgetLimit: number | undefined,
  budgetCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  snapshot: ShoppingRatesSnapshot,
): BudgetEvaluation {
  if (!budgetLimit || budgetLimit <= 0) {
    return {
      hasBudget: false,
      limitInDisplay: 0,
      totalInDisplay: totals[displayCurrency],
      remainingInDisplay: 0,
      percentageUsed: 0,
      status: 'ok',
    };
  }

  const limitInDisplay = convertShoppingAmount(
    budgetLimit,
    budgetCurrency,
    snapshot,
  )[displayCurrency];
  const totalInDisplay = totals[displayCurrency];
  const remainingInDisplay = limitInDisplay - totalInDisplay;
  const percentageUsed =
    limitInDisplay > 0 ? (totalInDisplay / limitInDisplay) * 100 : 0;

  const status: BudgetEvaluation['status'] =
    percentageUsed > 100.01
      ? 'exceeded'
      : percentageUsed >= 85
        ? 'warning'
        : 'ok';

  return {
    hasBudget: true,
    limitInDisplay,
    totalInDisplay,
    remainingInDisplay,
    percentageUsed,
    status,
  };
}

export interface ActualPaidComparison {
  hasActualPaid: boolean;
  actualInDisplay: number;
  calculatedInDisplay: number;
  diffInDisplay: number;
  diffPercent: number;
  state: 'exact' | 'over' | 'under';
}

/** Compare actual checkout price paid vs calculated list total */
export function compareActualPaid(
  totals: ConversionMap,
  actualPaidAmount: number | undefined,
  actualPaidCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  snapshot: ShoppingRatesSnapshot,
): ActualPaidComparison {
  if (actualPaidAmount === undefined || actualPaidAmount <= 0) {
    return {
      hasActualPaid: false,
      actualInDisplay: 0,
      calculatedInDisplay: totals[displayCurrency],
      diffInDisplay: 0,
      diffPercent: 0,
      state: 'exact',
    };
  }

  const actualInDisplay = convertShoppingAmount(
    actualPaidAmount,
    actualPaidCurrency,
    snapshot,
  )[displayCurrency];
  const calculatedInDisplay = totals[displayCurrency];
  const diffInDisplay = actualInDisplay - calculatedInDisplay;
  const diffPercent =
    calculatedInDisplay > 0 ? (diffInDisplay / calculatedInDisplay) * 100 : 0;

  const state: ActualPaidComparison['state'] =
    Math.abs(diffInDisplay) < 0.01
      ? 'exact'
      : diffInDisplay > 0
        ? 'over'
        : 'under';

  return {
    hasActualPaid: true,
    actualInDisplay,
    calculatedInDisplay,
    diffInDisplay,
    diffPercent,
    state,
  };
}

/** Normalize user decimal keyboard input (comma or dot, max N decimal digits) */
export function sanitizeDecimalInput(
  nextText: string,
  prevValue: string,
  maxDecimals = 2,
): string {
  const commaNormalized =
    !prevValue.includes('.') && nextText.endsWith(',')
      ? `${nextText.slice(0, -1)}.`
      : nextText;
  const cleaned = commaNormalized.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('').slice(0, maxDecimals)}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
  }
  return cleaned;
}

/** Format quantity cleanly (integers without decimals, fractions trimmed) */
export function formatQuantity(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(2).replace(/\.?0+$/, '');
}
