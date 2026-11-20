import { forwardRef } from 'react';
import { Image, Text, View } from 'react-native';

import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode, CustomRateItem, UnifiedRates } from '@/types/currency.types';
import { convertWithRateSource } from '@/utils/customRateUtils';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { formatFullDateTime, formatNumber, formatPercentage } from '@/utils/formatters';

const APP_LOGO = require('@/assets/images/logo.webp');

export type ShareCardTheme = 'brand' | 'light' | 'dark';

export interface ShareCustomRateEntry {
  item: CustomRateItem;
  rateToVes: number;
}

interface RateShareCardProps {
  rates: UnifiedRates;
  theme: ShareCardTheme;
  includedCurrencies: Array<'USD' | 'EUR' | 'USDT'>;
  includedCustomRates: ShareCustomRateEntry[];
  highlightAmount?: number;
  highlightCurrency?: CurrencyCode;
}

export const RateShareCard = forwardRef<View, RateShareCardProps>(
  function RateShareCard(
    {
      rates,
      theme,
      includedCurrencies,
      includedCustomRates,
      highlightAmount = 0,
      highlightCurrency = 'USD',
    },
    ref,
  ) {
    const COLORS = useThemeColors();

    const palette =
      theme === 'brand'
        ? {
            bg: COLORS.primary,
            cardBg: 'rgba(255, 255, 255, 0.14)',
            cardBorder: 'rgba(255, 255, 255, 0.22)',
            title: '#ffffff',
            subtitle: 'rgba(255, 255, 255, 0.84)',
            rowLabel: '#ffffff',
            rowSub: 'rgba(255, 255, 255, 0.75)',
            rowValue: '#ffffff',
            highlightBg: '#ffffff',
            highlightTitle: COLORS.textMuted,
            highlightValue: COLORS.primary,
          }
        : theme === 'dark'
          ? {
              bg: '#16181d',
              cardBg: '#22252d',
              cardBorder: '#2f333f',
              title: '#f8fafc',
              subtitle: '#94a3b8',
              rowLabel: '#f8fafc',
              rowSub: '#94a3b8',
              rowValue: '#ffffff',
              highlightBg: COLORS.primary,
              highlightTitle: 'rgba(255, 255, 255, 0.82)',
              highlightValue: '#ffffff',
            }
          : {
              bg: '#ffffff',
              cardBg: '#f8fafc',
              cardBorder: '#e2e8f0',
              title: '#0f172a',
              subtitle: '#64748b',
              rowLabel: '#0f172a',
              rowSub: '#64748b',
              rowValue: '#0f172a',
              highlightBg: COLORS.primary,
              highlightTitle: 'rgba(255, 255, 255, 0.85)',
              highlightValue: '#ffffff',
            };

    const rateRows = [
      {
        code: 'USD' as const,
        name: 'Dólar oficial',
        source: 'BCV',
        rate: rates.usd.rateToVes,
        change: rates.usd.changePercentage,
      },
      {
        code: 'EUR' as const,
        name: 'Euro oficial',
        source: 'BCV',
        rate: rates.eur.rateToVes,
        change: rates.eur.changePercentage,
      },
      {
        code: 'USDT' as const,
        name: 'USDT P2P',
        source: 'Yadio',
        rate: rates.usdt.rateToVes,
        change: rates.usdt.changePercentage,
      },
    ].filter((r) => includedCurrencies.includes(r.code));

    const highlightTarget = convertWithRateSource(
      highlightAmount,
      highlightCurrency,
      'BCV_USD',
      {
        usdToVes: rates.usd.rateToVes,
        eurToVes: rates.eur.rateToVes,
        usdtToVes: rates.usdt.rateToVes,
        customRates: [],
      },
    );

    const dateLabel = formatFullDateTime(rates.lastUpdated.toISOString());

    return (
      <View
        ref={ref}
        collapsable={false}
        className="w-full overflow-hidden rounded-3xl p-5"
        style={{
          backgroundColor: palette.bg,
          borderWidth: theme === 'light' ? 1 : 0,
          borderColor: palette.cardBorder,
          borderCurve: 'continuous',
        }}
      >
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  theme === 'brand'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : `${COLORS.primary}20`,
                borderCurve: 'continuous',
              }}
            >
              <Image
                source={APP_LOGO}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text
                className="text-base font-bold tracking-wide"
                style={{ color: palette.title }}
              >
                RATESVEN
              </Text>
              <Text className="text-[11px]" style={{ color: palette.subtitle }}>
                Tasas de cambio del día
              </Text>
            </View>
          </View>

          <Text
            className="text-[11px] font-medium"
            style={{ color: palette.subtitle }}
          >
            {dateLabel}
          </Text>
        </View>

        {/* Official Rates */}
        <View className="gap-2.5">
          {rateRows.map((row) => {
            const isPositive = row.change >= 0;
            return (
              <View
                key={row.code}
                className="flex-row items-center justify-between rounded-2xl border px-3.5 py-3"
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.cardBorder,
                  borderCurve: 'continuous',
                }}
              >
                <View className="flex-row items-center gap-2.5">
                  <CurrencyIcon currency={row.code} size={22} />
                  <View>
                    <Text
                      className="text-sm font-bold"
                      style={{ color: palette.rowLabel }}
                    >
                      {row.code} • {row.source}
                    </Text>
                    <Text
                      className="text-[11px]"
                      style={{ color: palette.rowSub }}
                    >
                      {row.name}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    className="text-base font-bold"
                    style={{
                      color: palette.rowValue,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {row.rate > 0 ? `${formatNumber(row.rate, 2)} Bs` : '--'}
                  </Text>
                  <Text
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        theme === 'brand'
                          ? 'rgba(255, 255, 255, 0.85)'
                          : isPositive
                            ? COLORS.success
                            : COLORS.danger,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatPercentage(row.change)}
                  </Text>
                </View>
              </View>
            );
          })}

          {includedCustomRates.map(({ item, rateToVes }) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between rounded-2xl border px-3.5 py-3"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
                borderCurve: 'continuous',
              }}
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-xl">{item.emoji}</Text>
                <View>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: palette.rowLabel }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    className="text-[11px]"
                    style={{ color: palette.rowSub }}
                  >
                    Tasa personalizada
                  </Text>
                </View>
              </View>

              <Text
                className="text-base font-bold"
                style={{
                  color: palette.rowValue,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {rateToVes > 0 ? `${formatNumber(rateToVes, 2)} Bs` : '--'}
              </Text>
            </View>
          ))}
        </View>

        {/* Optional Highlighted Amount */}
        {highlightAmount > 0 && (
          <View
            className="mt-3.5 rounded-2xl p-3.5"
            style={{
              backgroundColor: palette.highlightBg,
              borderCurve: 'continuous',
            }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: palette.highlightTitle }}
            >
              Monto a enviar / cobrar ({CURRENCY_SYMBOLS[highlightCurrency]}{' '}
              {formatNumber(highlightAmount)} {highlightCurrency})
            </Text>

            <View className="mt-1 flex-row flex-wrap items-baseline justify-between gap-2">
              <Text
                className="text-xl font-bold"
                style={{
                  color: palette.highlightValue,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {highlightCurrency === 'VES'
                  ? `$ ${formatNumber(highlightTarget.USD)} USD`
                  : `${formatNumber(highlightTarget.VES)} Bs`}
              </Text>
              {highlightCurrency !== 'USD' && highlightCurrency !== 'VES' && (
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: palette.highlightTitle,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  ≈ ${formatNumber(highlightTarget.USD)} USD
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text
          className="mt-3.5 text-center text-[10px] font-medium"
          style={{ color: palette.subtitle }}
        >
          Fuentes: BCV • Yadio • Compartido con RatesVenApp
        </Text>
      </View>
    );
  },
);
