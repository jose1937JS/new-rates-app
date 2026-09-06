import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import type { CurrencyCode } from '@/types/currency.types';
import { COLORS } from '@/utils/constants';

interface CurrencyTabSelectorProps {
  currencies: CurrencyCode[];
  selected: CurrencyCode;
  onSelect: (currency: CurrencyCode) => void;
}

export function CurrencyTabSelector({
  currencies,
  selected,
  onSelect,
}: CurrencyTabSelectorProps) {
  const handlePress = (currency: CurrencyCode) => {
    if (currency !== selected) {
      void Haptics.selectionAsync();
      onSelect(currency);
    }
  };

  return (
    <View className="flex-row gap-2 rounded-xl bg-surface-card p-1" style={{ borderCurve: 'continuous' }}>
      {currencies.map((currency) => {
        const isActive = currency === selected;
        return (
          <Pressable
            key={currency}
            onPress={() => handlePress(currency)}
            className={`flex-1 items-center rounded-lg py-2 ${
              isActive ? 'bg-primary' : ''
            }`}
            style={isActive ? { borderCurve: 'continuous' } : undefined}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-white' : 'text-text-muted'
              }`}
            >
              {currency}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ----- Period Selector -----

interface PeriodSelectorProps {
  periods: string[];
  selected: string;
  onSelect: (period: string) => void;
}

export function PeriodSelector({
  periods,
  selected,
  onSelect,
}: PeriodSelectorProps) {
  return (
    <View className="flex-row gap-2">
      {periods.map((period) => {
        const isActive = period === selected;
        return (
          <Pressable
            key={period}
            onPress={() => {
              if (period !== selected) {
                void Haptics.selectionAsync();
                onSelect(period);
              }
            }}
            className={`rounded-lg px-4 py-1.5 ${
              isActive ? 'bg-primary/15' : 'bg-surface-elevated'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {period}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
