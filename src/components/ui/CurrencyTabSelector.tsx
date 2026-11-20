import { Banknote, Coins, DollarSign, Euro } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode } from '@/types/currency.types';
import { triggerSelectionHaptic } from '@/utils/haptics';

const CURRENCY_ICONS: Partial<
  Record<CurrencyCode, React.ComponentType<{ size?: number; color?: string }>>
> = {
  USD: DollarSign,
  EUR: Euro,
  USDT: Coins,
  VES: Banknote,
};

const TRACK_PADDING = 4;
const TAB_GAP = 6;
const SPRING_CONFIG = { damping: 20, stiffness: 240, mass: 0.8 };

interface CurrencyTabSelectorProps {
  currencies: CurrencyCode[];
  selected: CurrencyCode;
  onSelect: (currency: CurrencyCode) => void;
  variant?: 'default' | 'hero';
}

export function CurrencyTabSelector({
  currencies,
  selected,
  onSelect,
  variant = 'default',
}: CurrencyTabSelectorProps) {
  const COLORS = useThemeColors();
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);

  const isHero = variant === 'hero';
  const activeIndex = Math.max(0, currencies.indexOf(selected));
  const itemWidth =
    trackWidth > 0
      ? (trackWidth - TRACK_PADDING * 2 - TAB_GAP * (currencies.length - 1)) /
        currencies.length
      : 0;

  useEffect(() => {
    if (itemWidth <= 0) return;
    translateX.set(withSpring(activeIndex * (itemWidth + TAB_GAP), SPRING_CONFIG));
  }, [activeIndex, itemWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const handlePress = (currency: CurrencyCode) => {
    if (currency !== selected) {
      triggerSelectionHaptic();
      onSelect(currency);
    }
  };

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className="relative flex-row rounded-2xl p-1"
      style={{
        gap: TAB_GAP,
        backgroundColor: isHero ? 'rgba(255, 255, 255, 0.18)' : COLORS.surfaceCard,
        borderCurve: 'continuous',
      }}
    >
      {itemWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          className="absolute bottom-1 left-1 top-1 rounded-xl"
          style={[
            indicatorStyle,
            {
              width: itemWidth,
              backgroundColor: isHero ? '#ffffff' : COLORS.primary,
              borderCurve: 'continuous',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isHero ? 0.12 : 0.08,
              shadowRadius: 4,
              elevation: isHero ? 2 : 1,
            },
          ]}
        />
      )}

      {currencies.map((currency) => {
        const isActive = currency === selected;
        const IconComponent = CURRENCY_ICONS[currency];
        const activeColor = isHero ? COLORS.primary : '#ffffff';
        const inactiveColor = isHero ? 'rgba(255, 255, 255, 0.9)' : COLORS.textMuted;

        return (
          <Pressable
            key={currency}
            onPress={() => handlePress(currency)}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
            style={{ borderCurve: 'continuous' }}
          >
            {IconComponent && (
              <IconComponent
                size={15}
                color={isActive ? activeColor : inactiveColor}
              />
            )}
            <Text
              className="text-sm font-medium"
              style={{ color: isActive ? activeColor : inactiveColor }}
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

const PERIOD_ITEM_WIDTH = 42;
const PERIOD_GAP = 4;

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
  const COLORS = useThemeColors();
  const translateX = useSharedValue(
    Math.max(0, periods.indexOf(selected)) * (PERIOD_ITEM_WIDTH + PERIOD_GAP),
  );

  const activeIndex = Math.max(0, periods.indexOf(selected));

  useEffect(() => {
    translateX.set(
      withSpring(activeIndex * (PERIOD_ITEM_WIDTH + PERIOD_GAP), SPRING_CONFIG),
    );
  }, [activeIndex, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <View
      className="relative flex-row items-center rounded-xl border border-border bg-surface-card p-1"
      style={{ gap: PERIOD_GAP, borderCurve: 'continuous' }}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute bottom-1 left-1 top-1 rounded-lg"
        style={[
          indicatorStyle,
          {
            width: PERIOD_ITEM_WIDTH,
            backgroundColor: COLORS.primary,
            borderCurve: 'continuous',
          },
        ]}
      />

      {periods.map((period) => {
        const isActive = period === selected;
        return (
          <Pressable
            key={period}
            onPress={() => {
              if (period !== selected) {
                triggerSelectionHaptic();
                onSelect(period);
              }
            }}
            className="items-center justify-center rounded-lg py-1.5"
            style={{ width: PERIOD_ITEM_WIDTH, borderCurve: 'continuous' }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: isActive ? '#ffffff' : COLORS.textMuted }}
            >
              {period}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
