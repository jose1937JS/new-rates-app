import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { formatNumber, formatPercentage } from '@/utils/formatters';

interface StatsRowProps {
  current: number;
  max: number;
  min: number;
  change: number;
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text className="text-xs text-text-muted">{label}</Text>
      <Text
        className={`text-sm font-bold ${color ?? 'text-text-primary'}`}
        style={{ fontVariant: ['tabular-nums'] }}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

export function StatsRow({ current, max, min, change }: StatsRowProps) {
  const isPositive = change >= 0;

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(400)}
      className="flex-row rounded-2xl bg-surface-card p-4"
      style={{ borderCurve: 'continuous' }}
    >
      <StatItem label="Actual" value={formatNumber(current, 2)} />
      <View className="w-px bg-border" />
      <StatItem label="Máximo" value={formatNumber(max, 2)} />
      <View className="w-px bg-border" />
      <StatItem label="Mínimo" value={formatNumber(min, 2)} />
      <View className="w-px bg-border" />
      <StatItem
        label="Variación"
        value={formatPercentage(change)}
        color={isPositive ? 'text-success' : 'text-danger'}
      />
    </Animated.View>
  );
}
