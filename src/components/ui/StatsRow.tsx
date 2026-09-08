import { Activity, ArrowDownRight, ArrowUpRight, Percent } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface StatsRowProps {
  current: number;
  max: number;
  min: number;
  change: number;
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text className="text-[11px] text-text-muted">{label}</Text>
      </View>
      <Text
        className={`text-sm font-medium ${color ?? 'text-text-primary'}`}
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
  const COLORS = useThemeColors();

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(400)}
      className="flex-row rounded-2xl bg-surface-card p-3.5"
      style={{ borderCurve: 'continuous' }}
    >
      <StatItem
        icon={<Activity size={12} color={COLORS.textMuted} />}
        label="Actual"
        value={formatNumber(current, 2)}
      />
      <View className="w-px bg-border my-0.5" />
      <StatItem
        icon={<ArrowUpRight size={12} color={COLORS.success} />}
        label="Máximo"
        value={formatNumber(max, 2)}
      />
      <View className="w-px bg-border my-0.5" />
      <StatItem
        icon={<ArrowDownRight size={12} color={COLORS.danger} />}
        label="Mínimo"
        value={formatNumber(min, 2)}
      />
      <View className="w-px bg-border my-0.5" />
      <StatItem
        icon={<Percent size={12} color={isPositive ? COLORS.success : COLORS.danger} />}
        label="Variación"
        value={formatPercentage(change)}
        color={isPositive ? 'text-success' : 'text-danger'}
      />
    </Animated.View>
  );
}
