import { Activity, ArrowDownRight, ArrowUpRight, Percent } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
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
    <Animated.View entering={FadeInUp.delay(200).duration(400)}>
      <Card noPadding className="flex-row p-3.5">
        <StatItem
          icon={<Activity size={12} color={COLORS.textMuted} />}
          label="Actual"
          value={formatNumber(current, 2)}
        />
        <View className="my-0.5 w-px bg-border" />
        <StatItem
          icon={<ArrowUpRight size={12} color={COLORS.success} />}
          label="Máximo"
          value={formatNumber(max, 2)}
        />
        <View className="my-0.5 w-px bg-border" />
        <StatItem
          icon={<ArrowDownRight size={12} color={COLORS.danger} />}
          label="Mínimo"
          value={formatNumber(min, 2)}
        />
        <View className="my-0.5 w-px bg-border" />
        <StatItem
          icon={<Percent size={12} color={isPositive ? COLORS.success : COLORS.danger} />}
          label="Variación"
          value={formatPercentage(change)}
          color={isPositive ? 'text-success' : 'text-danger'}
        />
      </Card>
    </Animated.View>
  );
}
