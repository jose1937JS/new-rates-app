import { forwardRef } from 'react';
import { Image, Text, View } from 'react-native';

import { RatesVenTitle } from '@/components/ui/RatesVenTitle';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ShoppingList } from '@/types/currency.types';
import { formatFullDateTime, formatNumber } from '@/utils/formatters';
import {
  compareActualPaid,
  formatQuantity,
  formatShoppingMoney,
  getItemSubtotal,
  getListTotals,
} from '@/utils/shoppingUtils';

const APP_LOGO = require('@/assets/images/logo.webp');

interface ShoppingTicketProps {
  list: ShoppingList;
  businessName?: string;
}

export const ShoppingTicket = forwardRef<View, ShoppingTicketProps>(
  function ShoppingTicket({ list, businessName }, ref) {
    const COLORS = useThemeColors();
    const totals = getListTotals(list);
    const actualComparison = compareActualPaid(
      totals,
      list.actualPaidAmount,
      list.actualPaidCurrency,
      list.displayCurrency,
      list.ratesSnapshot,
    );
    const secondaryCurrency = list.displayCurrency === 'VES' ? 'USD' : 'VES';
    const trimmedBiz = businessName?.trim();

    return (
      <View
        ref={ref}
        collapsable={false}
        className="w-full rounded-2xl border border-slate-200 bg-white p-5"
        style={{ borderCurve: 'continuous' }}
      >
        {/* Receipt header */}
        <View className="items-center border-b border-dashed border-slate-300 pb-3.5">
          <View className="mb-1.5 flex-row items-center gap-2">
            <View
              className="h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${COLORS.primary}20` }}
            >
              <Image
                source={APP_LOGO}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </View>
            {trimmedBiz ? (
              <Text className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {trimmedBiz}
              </Text>
            ) : (
              <RatesVenTitle size="sm" variant="light" />
            )}
          </View>
          <Text className="text-base font-semibold text-slate-900">
            {list.title}
          </Text>
          <Text className="mt-0.5 text-[11px] text-slate-500">
            {formatFullDateTime(list.completedAt ?? list.createdAt)} •{' '}
            {list.status === 'active' ? 'Presupuesto' : 'Comprobante'}
          </Text>
        </View>

        {/* Items list */}
        <View className="gap-2 border-b border-dashed border-slate-300 py-3.5">
          {list.items.length === 0 ? (
            <Text className="py-2 text-center text-xs text-slate-400">
              Sin productos registrados
            </Text>
          ) : (
            list.items.map((item) => {
              const subtotal = getItemSubtotal(
                item,
                list.displayCurrency,
                list.ratesSnapshot,
              );
              return (
                <View
                  key={item.id}
                  className="flex-row items-start justify-between gap-2"
                >
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">
                      {item.name}
                    </Text>
                    <Text
                      className="text-[11px] text-slate-500"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatQuantity(item.quantity)} ×{' '}
                      {formatShoppingMoney(item.unitPrice, item.currency)}
                    </Text>
                  </View>
                  <Text
                    className="text-xs font-bold text-slate-900"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatShoppingMoney(subtotal, list.displayCurrency)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Totals */}
        <View className="gap-1.5 border-b border-dashed border-slate-300 py-3.5">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-xs font-semibold text-slate-600">
              TOTAL CALCULADO ({list.displayCurrency})
            </Text>
            <Text
              className="text-lg font-bold"
              style={{
                color: COLORS.primary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatShoppingMoney(
                totals[list.displayCurrency],
                list.displayCurrency,
              )}
            </Text>
          </View>

          <View className="flex-row items-baseline justify-between">
            <Text className="text-[11px] text-slate-500">
              Equivalente ({secondaryCurrency})
            </Text>
            <Text
              className="text-xs font-semibold text-slate-700"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatShoppingMoney(totals[secondaryCurrency], secondaryCurrency)}
            </Text>
          </View>

          {actualComparison.hasActualPaid && (
            <View className="mt-1 flex-row items-baseline justify-between rounded-lg bg-slate-100 px-2.5 py-1.5">
              <Text className="text-[11px] font-semibold text-slate-700">
                Real cobrado
              </Text>
              <Text
                className="text-xs font-bold text-slate-900"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatShoppingMoney(
                  actualComparison.actualInDisplay,
                  list.displayCurrency,
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="items-center pt-3">
          <Text
            className="text-[10px] text-slate-500"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            Tasas: USD {formatNumber(list.ratesSnapshot.usdToVes)} Bs • EUR{' '}
            {formatNumber(list.ratesSnapshot.eurToVes)} Bs • USDT{' '}
            {formatNumber(list.ratesSnapshot.usdtToVes)} Bs
          </Text>
          <Text className="mt-1 text-[10px] font-semibold text-slate-400">
            Generado con RatesVEN
          </Text>
        </View>
      </View>
    );
  },
);
