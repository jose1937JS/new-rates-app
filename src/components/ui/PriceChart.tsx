import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import type { ChartDataPoint } from '@/types/currency.types';
import { COLORS } from '@/utils/constants';
import { formatChartDate } from '@/utils/formatters';

interface PriceChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
}

export function PriceChart({ data, isLoading }: PriceChartProps) {
  if (isLoading) {
    return (
      <View className="h-52 items-center justify-center rounded-2xl bg-surface-card" style={{ borderCurve: 'continuous' }}>
        <Text className="text-text-muted">Cargando gráfico...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className="h-52 items-center justify-center rounded-2xl bg-surface-card" style={{ borderCurve: 'continuous' }}>
        <Text className="text-text-muted">Sin datos disponibles</Text>
      </View>
    );
  }

  const chartData = data.map((point) => ({
    value: point.value,
    label: formatChartDate(point.date),
    dataPointText: point.value.toFixed(2),
  }));

  // Show labels every N points to avoid overlap
  const labelInterval = Math.max(1, Math.floor(chartData.length / 6));
  const labelledData = chartData.map((item, i) => ({
    ...item,
    label: i % labelInterval === 0 ? item.label : '',
    showDataPoint: i % labelInterval === 0,
  }));

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.1 || 10;

  return (
    <View className="rounded-2xl bg-surface-card p-4" style={{ borderCurve: 'continuous' }}>
      <LineChart
        data={labelledData}
        width={280}
        height={180}
        color={COLORS.primary}
        thickness={2.5}
        dataPointsColor={COLORS.primary}
        dataPointsRadius={4}
        startFillColor={`${COLORS.primary}40`}
        endFillColor={`${COLORS.primary}05`}
        areaChart
        curved
        yAxisOffset={Math.floor(minVal - padding)}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor={COLORS.border}
        yAxisTextStyle={{ color: COLORS.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{
          color: COLORS.textMuted,
          fontSize: 9,
          width: 40,
        }}
        hideRules
        adjustToWidth
        isAnimated
        animationDuration={800}
        pointerConfig={{
          pointerStripColor: COLORS.primary,
          pointerStripWidth: 1,
          pointerColor: COLORS.primary,
          radius: 5,
          pointerLabelWidth: 80,
          pointerLabelHeight: 30,
          pointerLabelComponent: (items: Array<{ value: number }>) => (
            <View className="rounded-lg bg-primary px-2 py-1">
              <Text className="text-center text-xs font-bold text-white">
                {items[0]?.value.toFixed(2)}
              </Text>
            </View>
          ),
        }}
      />
    </View>
  );
}
