import type { BillSplit, SplitPerson } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { convertWithRateSource } from '@/utils/customRateUtils';
import { formatNumber } from '@/utils/formatters';

export interface PersonShareSummary {
  person: SplitPerson;
  amount: number;
  isCustom: boolean;
  equivalents: {
    USD: number;
    EUR: number;
    USDT: number;
    VES: number;
  };
}

export interface SplitSummary {
  baseTotal: number;
  tipAmount: number;
  grandTotal: number;
  assignedTotal: number;
  differenceAmount: number;
  customCount: number;
  autoCount: number;
  grandEquivalents: {
    USD: number;
    EUR: number;
    USDT: number;
    VES: number;
  };
  shares: PersonShareSummary[];
  paidCount: number;
  totalCount: number;
  paidAmount: number;
  pendingAmount: number;
  pendingEquivalents: {
    USD: number;
    EUR: number;
    USDT: number;
    VES: number;
  };
}

export interface PersonShareConstraints {
  otherCustomTotal: number;
  otherAutoCount: number;
  remainingTotal: number;
  isLastFreePerson: boolean;
}

export function getPersonShareConstraints(
  split: BillSplit,
  personId: string,
  grandTotal: number,
): PersonShareConstraints {
  const grandTotalCents = Math.round(Math.max(0, grandTotal) * 100);
  let otherCustomCents = 0;
  let otherAutoCount = 0;

  for (const person of split.people) {
    if (person.id === personId) continue;
    if (
      typeof person.customAmount === 'number' &&
      Number.isFinite(person.customAmount) &&
      person.customAmount >= 0
    ) {
      otherCustomCents += Math.round(person.customAmount * 100);
    } else {
      otherAutoCount += 1;
    }
  }

  const remainingCents = Math.max(0, grandTotalCents - otherCustomCents);

  return {
    otherCustomTotal: otherCustomCents / 100,
    otherAutoCount,
    remainingTotal: remainingCents / 100,
    isLastFreePerson: otherAutoCount === 0,
  };
}

export function computeSplitSummary(split: BillSplit): SplitSummary {
  const baseTotal = Math.max(0, split.total || 0);
  const tipAmount =
    split.tipMode === 'percent'
      ? baseTotal * (Math.max(0, split.tipValue) / 100)
      : split.tipMode === 'fixed'
        ? Math.max(0, split.tipValue)
        : 0;

  const grandTotal = baseTotal + tipAmount;
  const grandTotalCents = Math.round(grandTotal * 100);

  let customTotalCents = 0;
  let customCount = 0;
  let autoCount = 0;

  for (const person of split.people) {
    if (
      typeof person.customAmount === 'number' &&
      Number.isFinite(person.customAmount) &&
      person.customAmount >= 0
    ) {
      customTotalCents += Math.round(person.customAmount * 100);
      customCount += 1;
    } else {
      autoCount += 1;
    }
  }

  const remainingPoolCents = Math.max(0, grandTotalCents - customTotalCents);
  const baseShareCents =
    autoCount > 0 ? Math.floor(remainingPoolCents / autoCount) : 0;
  const remainderCents = autoCount > 0 ? remainingPoolCents % autoCount : 0;

  let autoIndex = 0;
  let paidCents = 0;
  let assignedCents = 0;

  const shares: PersonShareSummary[] = split.people.map((person) => {
    const isCustom =
      typeof person.customAmount === 'number' &&
      Number.isFinite(person.customAmount) &&
      person.customAmount >= 0;

    let cents = 0;
    if (isCustom) {
      cents = Math.round((person.customAmount ?? 0) * 100);
    } else {
      cents = baseShareCents + (autoIndex < remainderCents ? 1 : 0);
      autoIndex += 1;
    }

    assignedCents += cents;
    const amount = cents / 100;
    if (person.paid) {
      paidCents += cents;
    }

    const equivalents = convertWithRateSource(
      amount,
      split.currency,
      split.rateSource,
      split.ratesSnapshot,
    );

    return {
      person,
      amount,
      isCustom,
      equivalents,
    };
  });

  const paidAmount = paidCents / 100;
  const pendingAmount = Math.max(0, (grandTotalCents - paidCents) / 100);
  const assignedTotal = assignedCents / 100;
  const differenceAmount = (grandTotalCents - assignedCents) / 100;

  return {
    baseTotal,
    tipAmount,
    grandTotal,
    assignedTotal,
    differenceAmount,
    customCount,
    autoCount,
    grandEquivalents: convertWithRateSource(
      grandTotal,
      split.currency,
      split.rateSource,
      split.ratesSnapshot,
    ),
    shares,
    paidCount: split.people.filter((p) => p.paid).length,
    totalCount: split.people.length,
    paidAmount,
    pendingAmount,
    pendingEquivalents: convertWithRateSource(
      pendingAmount,
      split.currency,
      split.rateSource,
      split.ratesSnapshot,
    ),
  };
}

export function buildSplitShareText(
  split: BillSplit,
  summary: SplitSummary,
): string {
  const sym = CURRENCY_SYMBOLS[split.currency];
  const lines = [
    `🍽️ *${split.title}*`,
    `Total: *${sym} ${formatNumber(summary.grandTotal)} ${split.currency}*${
      split.currency !== 'VES' && summary.grandEquivalents.VES > 0
        ? ` (${formatNumber(summary.grandEquivalents.VES)} Bs)`
        : ''
    }`,
    `Pagado: ${summary.paidCount}/${summary.totalCount} personas`,
    '',
  ];

  for (const item of summary.shares) {
    const status = item.person.paid ? '✅ Pagó' : '⏳ Pendiente';
    const bsPart =
      split.currency !== 'VES' && item.equivalents.VES > 0
        ? ` / ${formatNumber(item.equivalents.VES)} Bs`
        : '';
    lines.push(
      `• ${item.person.name}: *${sym} ${formatNumber(item.amount)}*${bsPart} — ${status}`,
    );
  }

  lines.push('');
  lines.push('_Dividido con RatesVenApp_');
  return lines.join('\n');
}
