import { ArrowUpRight, Copy, Percent, SplitSquareHorizontal } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode, FiscalSettings } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import type { FiscalBreakdown } from '@/utils/fiscalUtils';
import { formatBankAmount, formatNumber } from '@/utils/formatters';
import { triggerSelectionHaptic } from '@/utils/haptics';
import { copyToClipboard } from '@/utils/shareUtils';

function FiscalToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const COLORS = useThemeColors();
  const progress = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.set(withTiming(active ? 1 : 0, { duration: 180 }));
  }, [active, progress]);

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [COLORS.surfaceCard, COLORS.primary],
    ),
    borderColor: interpolateColor(
      progress.get(),
      [0, 1],
      [COLORS.border, COLORS.primary],
    ),
  }));

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onPress();
      }}
      onPressIn={() => {
        scale.set(withTiming(0.95, { duration: 80 }));
      }}
      onPressOut={() => {
        scale.set(withTiming(1, { duration: 120 }));
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
    >
      <Animated.View
        className="flex-row items-center gap-1.5 rounded-xl border px-3 py-2"
        style={[{ borderCurve: 'continuous' }, chipStyle]}
      >
        <Percent size={13} color={active ? '#ffffff' : COLORS.primary} />
        <Text
          className="text-xs font-medium"
          style={{ color: active ? '#ffffff' : COLORS.textPrimary }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface FiscalToolsCardProps {
  currency: CurrencyCode;
  fiscalSettings: FiscalSettings;
  ivaActive: boolean;
  igtfActive: boolean;
  breakdown: FiscalBreakdown;
  totalInVes: number;
  onToggleIva: () => void;
  onToggleIgtf: () => void;
  onOpenMixedPayment: () => void;
}

export function FiscalToolsCard({
  currency,
  fiscalSettings,
  ivaActive,
  igtfActive,
  breakdown,
  totalInVes,
  onToggleIva,
  onToggleIgtf,
  onOpenMixedPayment,
}: FiscalToolsCardProps) {
  const COLORS = useThemeColors();
  const hasTaxes = ivaActive || igtfActive;
  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <FiscalToggleChip
          label={`+ IVA ${fiscalSettings.ivaPercent}%`}
          active={ivaActive}
          onPress={onToggleIva}
        />

        <FiscalToggleChip
          label={`+ IGTF ${fiscalSettings.igtfPercent}%`}
          active={igtfActive}
          onPress={onToggleIgtf}
        />

        <Pressable
          onPress={() => {
            triggerSelectionHaptic();
            onOpenMixedPayment();
          }}
          className="ml-auto flex-row items-center gap-1 rounded-xl border border-border bg-surface-card px-3 py-2 active:opacity-80"
          style={{ borderCurve: 'continuous' }}
        >
          <SplitSquareHorizontal size={13} color={COLORS.primary} />
          <Text className="text-xs font-medium text-text-primary">
            Pago mixto
          </Text>
          <ArrowUpRight size={12} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {hasTaxes && breakdown.baseAmount > 0 && (
        <Card
          className="border"
          style={{ borderColor: `${COLORS.primary}45` }}
        >
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <Text className="text-xs text-text-secondary">
                Base: {symbol} {formatNumber(breakdown.baseAmount)}
              </Text>
              {ivaActive && (
                <Text className="text-xs text-text-secondary">
                  + IVA: {symbol} {formatNumber(breakdown.ivaAmount)}
                </Text>
              )}
              {igtfActive && (
                <Text className="text-xs text-text-secondary">
                  + IGTF: {symbol} {formatNumber(breakdown.igtfAmount)}
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                void copyToClipboard(
                  formatBankAmount(totalInVes),
                  'Total con impuestos copiado (Bs)',
                );
              }}
              className="flex-row items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-1 active:opacity-75"
            >
              <Text
                className="text-xs font-medium"
                style={{
                  color: COLORS.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                Total: {symbol} {formatNumber(breakdown.totalAmount)}
              </Text>
              <Copy size={11} color={COLORS.primary} />
            </Pressable>
          </View>
        </Card>
      )}
    </View>
  );
}
