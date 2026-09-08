import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { CurrencyCode } from '@/types/currency.types';
import { CURRENCY_FLAGS, CURRENCY_SYMBOLS } from '@/utils/constants';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface RateCardProps {
  currency: CurrencyCode;
  convertedAmount: number;
  rate: number;
  changePercentage: number;
  onPress: () => void;
  isSelected: boolean;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RateCard({
  currency,
  convertedAmount,
  rate,
  changePercentage,
  onPress,
  isSelected,
  index,
}: RateCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = () => {
    scale.set(withTiming(0.97, { duration: 100 }));
  };

  const handlePressOut = () => {
    scale.set(withTiming(1, { duration: 150 }));
  };

  const isPositive = changePercentage >= 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, { borderCurve: 'continuous' }]}
        className={`rounded-2xl p-4 ${
          isSelected
            ? 'border-2 border-primary bg-primary/10'
            : 'border border-border bg-surface-card'
        }`}
      >
        {/* Header row */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl">{CURRENCY_FLAGS[currency]}</Text>
          <Text className="text-lg font-medium text-text-primary">
            {currency}
          </Text>
        </View>
        <View
          className={`rounded-full px-2 py-0.5 ${
            isPositive ? 'bg-success/15' : 'bg-danger/15'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isPositive ? 'text-success' : 'text-danger'
            }`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatPercentage(changePercentage)}
          </Text>
        </View>
      </View>

      {/* Converted amount */}
      <Text
        className="mb-1 text-2xl font-medium text-text-primary"
        style={{ fontVariant: ['tabular-nums'] }}
        selectable
      >
        {CURRENCY_SYMBOLS[currency]} {formatNumber(convertedAmount)}
      </Text>

      {/* Rate info */}
      <Text className="text-sm text-text-secondary">
        1 {currency} = {formatNumber(rate, 2)} VES
      </Text>
    </AnimatedPressable>
  </Animated.View>
  );
}
