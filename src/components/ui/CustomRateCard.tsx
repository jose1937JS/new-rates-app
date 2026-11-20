import { Copy } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode, CustomRateItem, UnifiedRates } from '@/types/currency.types';
import { formatBankAmount, formatNumber, formatPercentage } from '@/utils/formatters';
import { triggerSelectionHaptic } from '@/utils/haptics';
import { copyToClipboard } from '@/utils/shareUtils';

interface CustomRateCardProps {
  item: CustomRateItem;
  rateToVes: number;
  inputCurrency: CurrencyCode;
  usdEquivalentAmount: number;
  vesAmount: number;
  rates: UnifiedRates;
  index: number;
  taxBadge?: string;
}

export function CustomRateCard({
  item,
  rateToVes,
  inputCurrency,
  usdEquivalentAmount,
  vesAmount,
  rates,
  index,
  taxBadge,
}: CustomRateCardProps) {
  const COLORS = useThemeColors();
  const isVesInput = inputCurrency === 'VES';

  const convertedValue = isVesInput
    ? rateToVes > 0
      ? vesAmount / rateToVes
      : 0
    : usdEquivalentAmount * rateToVes;

  const displayFormatted = isVesInput
    ? `$ ${formatNumber(convertedValue)}`
    : `Bs ${formatNumber(convertedValue)}`;

  const bcvRate = rates.usd.rateToVes;
  const diffPercent =
    bcvRate > 0 && rateToVes > 0 ? ((rateToVes - bcvRate) / bcvRate) * 100 : 0;

  const modeLabel =
    item.mode === 'fixed'
      ? 'Fija'
      : item.mode === 'average'
        ? 'Promedio'
        : `Margen ${item.marginPercent >= 0 ? '+' : ''}${item.marginPercent}%`;

  const handleCopy = () => {
    triggerSelectionHaptic();
    const valueToCopy = isVesInput
      ? convertedValue.toFixed(2)
      : formatBankAmount(convertedValue);
    void copyToClipboard(
      valueToCopy,
      `${item.label}: ${isVesInput ? `$${valueToCopy}` : `${valueToCopy} Bs`} copiado`,
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(320)}>
      <Pressable
        onPress={handleCopy}
        className="rounded-2xl border border-border bg-surface-card p-4 active:opacity-85"
        style={{
          borderColor: COLORS.border,
          borderCurve: 'continuous',
        }}
      >
        <View className="mb-1.5 flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Text className="text-lg">{item.emoji}</Text>
            <Text
              className="flex-shrink text-base font-semibold text-text-primary"
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: COLORS.surfaceElevated }}
            >
              <Text className="text-[10px] font-medium text-text-secondary">
                {modeLabel}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5">
            {taxBadge ? (
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${COLORS.primary}1A` }}
              >
                <Text
                  className="text-[10px] font-semibold"
                  style={{ color: COLORS.primary }}
                >
                  {taxBadge}
                </Text>
              </View>
            ) : null}
            {bcvRate > 0 && rateToVes > 0 && (
              <View
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor:
                    Math.abs(diffPercent) < 0.05
                      ? COLORS.surfaceElevated
                      : diffPercent > 0
                        ? 'rgba(239, 68, 68, 0.14)'
                        : 'rgba(34, 197, 94, 0.14)',
                }}
              >
                <Text
                  className="text-[10px] font-semibold"
                  style={{
                    color:
                      Math.abs(diffPercent) < 0.05
                        ? COLORS.textMuted
                        : diffPercent > 0
                          ? COLORS.danger
                          : COLORS.success,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatPercentage(diffPercent)} vs BCV
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-baseline justify-between gap-2">
          <Text
            className="text-2xl font-medium text-text-primary"
            style={{ fontVariant: ['tabular-nums'] }}
            selectable
          >
            {rateToVes > 0 ? displayFormatted : '--'}
          </Text>

          <View className="flex-row items-center gap-1">
            <Copy size={12} color={COLORS.textMuted} />
            <Text className="text-[11px] text-text-muted">Copiar</Text>
          </View>
        </View>

        <Text className="mt-1 text-xs text-text-secondary">
          {rateToVes > 0
            ? `1 $ = ${formatNumber(rateToVes, 2)} Bs${
                item.rounding > 0 ? ` • Redondeo ${item.rounding} Bs` : ''
              }`
            : 'Tasa personalizada no disponible'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
