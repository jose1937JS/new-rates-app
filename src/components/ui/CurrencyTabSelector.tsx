import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DollarSign, Euro, Coins, Banknote } from 'lucide-react-native';

import type { CurrencyCode } from '@/types/currency.types';

const CURRENCY_ICONS: Partial<Record<CurrencyCode, React.ComponentType<{ size?: number; color?: string }>>> = {
  USD: DollarSign,
  EUR: Euro,
  USDT: Coins,
  VES: Banknote,
};

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
        const IconComponent = CURRENCY_ICONS[currency];
        return (
          <Pressable
            key={currency}
            onPress={() => handlePress(currency)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 ${
              isActive ? 'bg-primary' : ''
            }`}
            style={isActive ? { borderCurve: 'continuous' } : undefined}
          >
            {IconComponent && (
              <IconComponent size={14} color={isActive ? '#FFFFFF' : '#94A3B8'} />
            )}
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
    <View
      className="flex-row items-center gap-1 rounded-xl bg-surface-card p-1"
      style={{ borderCurve: 'continuous' }}
    >
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
            className={`rounded-lg px-2.5 py-1 ${
              isActive ? 'bg-primary' : 'bg-transparent'
            }`}
            style={isActive ? { borderCurve: 'continuous' } : undefined}
          >
            <Text
              className={`text-xs font-semibold ${
                isActive ? 'text-white' : 'text-text-muted'
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
