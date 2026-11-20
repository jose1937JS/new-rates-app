import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode } from '@/types/currency.types';

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT', 'VES'];

interface CurrencyChipRowProps {
  selected: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  variant?: 'default' | 'hero';
  currencies?: CurrencyCode[];
}

export function CurrencyChipRow({
  selected,
  onSelect,
  variant = 'default',
  currencies = CURRENCIES,
}: CurrencyChipRowProps) {
  const COLORS = useThemeColors();
  const isHero = variant === 'hero';

  return (
    <View
      className="flex-row rounded-xl p-1"
      style={{
        backgroundColor: isHero
          ? 'rgba(0, 0, 0, 0.16)'
          : COLORS.surfaceElevated,
        borderCurve: 'continuous',
      }}
    >
      {currencies.map((code) => {
        const isActive = code === selected;
        return (
          <Pressable
            key={code}
            onPress={() => {
              if (code === selected) return;
              void Haptics.selectionAsync();
              onSelect(code);
            }}
            className="flex-1 flex-row items-center justify-center gap-1 rounded-lg py-1.5 active:opacity-80"
            style={{
              backgroundColor: isActive
                ? isHero
                  ? '#ffffff'
                  : COLORS.primary
                : 'transparent',
              borderCurve: 'continuous',
            }}
          >
            <CurrencyIcon currency={code} size={13} />
            <Text
              className="text-xs font-semibold"
              style={{
                color: isActive
                  ? isHero
                    ? COLORS.primary
                    : '#ffffff'
                  : isHero
                    ? '#ffffff'
                    : COLORS.textSecondary,
              }}
            >
              {code}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
