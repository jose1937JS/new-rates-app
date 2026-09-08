import { useCallback } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode } from '@/types/currency.types';
import {
  CURRENCY_FLAGS,
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
} from '@/utils/constants';
import { formatInputValue } from '@/utils/formatters';

interface CurrencyInputProps {
  value: string;
  currency: CurrencyCode;
  onChangeText: (text: string) => void;
  onCurrencyPress?: () => void;
}

export function CurrencyInput({
  value,
  currency,
  onChangeText,
  onCurrencyPress,
}: CurrencyInputProps) {
  const COLORS = useThemeColors();
  const handleChange = useCallback(
    (text: string) => {
      // Allow only digits and a single decimal point
      const cleaned = text.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      const sanitized =
        parts.length > 2
          ? `${parts[0]}.${parts.slice(1).join('')}`
          : cleaned;
      onChangeText(sanitized);
    },
    [onChangeText],
  );

  const displayValue = value ? formatInputValue(value) : '';

  return (
    <View className="rounded-2xl bg-surface-card p-4" style={{ borderCurve: 'continuous' }}>
      {/* Currency selector row */}
      <Pressable
        onPress={onCurrencyPress}
        className="mb-3 flex-row items-center gap-2 active:opacity-70"
      >
        <Animated.Text
          key={currency}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="text-2xl"
        >
          {CURRENCY_FLAGS[currency]}
        </Animated.Text>
        <Text className="text-base font-semibold text-text-primary">
          {CURRENCY_NAMES[currency]}
        </Text>
        <Text className="text-sm text-text-muted">
          ({CURRENCY_SYMBOLS[currency]})
        </Text>
      </Pressable>

      {/* Input row */}
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl font-medium text-primary">
          {CURRENCY_SYMBOLS[currency]}
        </Text>
        <TextInput
          value={displayValue}
          onChangeText={handleChange}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          autoFocus={true}
          className="flex-1 text-3xl font-bold text-text-primary"
          style={{ fontVariant: ['tabular-nums'] }}
          selectionColor={COLORS.primary}
        />
      </View>
    </View>
  );
}
