import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode } from '@/types/currency.types';
import {
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
} from '@/utils/constants';
import { formatInputValue } from '@/utils/formatters';

interface CurrencyInputProps {
  value: string;
  currency: CurrencyCode;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onCurrencyPress?: () => void;
}

export function CurrencyInput({
  value,
  currency,
  onChangeText,
  onClear,
  onCurrencyPress,
}: CurrencyInputProps) {
  const COLORS = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      // Allow locale decimal keyboards that emit ',' instead of '.'
      const commaNormalized =
        !value.includes('.') && text.endsWith(',')
          ? `${text.slice(0, -1)}.`
          : text;
      const cleaned = commaNormalized.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      const sanitized =
        parts.length > 2
          ? `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`
          : parts.length === 2
            ? `${parts[0]}.${parts[1].slice(0, 2)}`
            : cleaned;
      onChangeText(sanitized);
    },
    [onChangeText, value],
  );

  const handleClear = useCallback(() => {
    void Haptics.selectionAsync();
    if (onClear) {
      onClear();
    } else {
      onChangeText('1');
    }
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const displayValue = value ? formatInputValue(value) : '';
  const showClearButton = value.length > 0 && value !== '1';

  return (
    <Card
      className="border-2 shadow-sm"
      style={{
        borderColor: isFocused ? COLORS.primary : COLORS.border,
      }}
    >
      {/* Currency header row */}
      <Pressable
        onPress={onCurrencyPress ?? (() => inputRef.current?.focus())}
        className="mb-3 flex-row items-center gap-2 active:opacity-70"
      >
        <Animated.View
          key={currency}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <CurrencyIcon currency={currency} size={24} />
        </Animated.View>
        <Text className="text-base font-semibold text-text-primary">
          {CURRENCY_NAMES[currency]}
        </Text>
        <Text className="text-sm text-text-muted">
          ({CURRENCY_SYMBOLS[currency]})
        </Text>
      </Pressable>

      {/* Input row with fixed height so empty "0.00" placeholder never clips or shifts */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="flex-row items-center gap-2"
        style={{ minHeight: 52 }}
      >
        <Text
          className="text-2xl font-medium"
          style={{ color: COLORS.primary, includeFontPadding: false }}
        >
          {CURRENCY_SYMBOLS[currency]}
        </Text>
        <TextInput
          ref={inputRef}
          value={displayValue}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          autoFocus={true}
          multiline={false}
          className="flex-1"
          style={{
            color: COLORS.textPrimary,
            fontFamily: 'Poppins_700Bold',
            fontSize: 30,
            height: 52,
            paddingVertical: 0,
            textAlignVertical: 'center',
            includeFontPadding: false,
            fontVariant: ['tabular-nums'],
          }}
          selectionColor={COLORS.primary}
        />
        {showClearButton && (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityLabel="Restablecer a 1"
            className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: COLORS.surfaceElevated }}
          >
            <X size={16} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </Pressable>
    </Card>
  );
}
