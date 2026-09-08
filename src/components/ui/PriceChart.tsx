import { Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartDataPoint } from '@/types/currency.types';
import { formatChartDate, formatFullDate } from '@/utils/formatters';

interface PriceChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
}

export function PriceChart({ data, isLoading }: PriceChartProps) {
  const COLORS = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  if (isLoading) {
    return (
      <View
        className="h-64 items-center justify-center rounded-2xl bg-surface-card"
        style={{ borderCurve: 'continuous' }}
      >
        <Text className="text-sm text-text-muted">Cargando gráfico...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View
        className="h-64 items-center justify-center rounded-2xl bg-surface-card"
        style={{ borderCurve: 'continuous' }}
      >
        <Text className="text-sm text-text-muted">Sin datos disponibles</Text>
      </View>
    );
  }

  // Available chart width: screen minus container padding (32) minus card padding (32) minus Y-axis width (42)
  const chartWidth = Math.max(240, screenWidth - 106);

  // Spacing per point allowing horizontal scroll for larger sets while spanning card for smaller sets
  const totalPoints = data.length;
  const minPointSpacing = 68;
  const autoSpacing =
    totalPoints > 1 ? (chartWidth - 40) / (totalPoints - 1) : chartWidth;
  const spacing = Math.max(minPointSpacing, autoSpacing);

  const labelledData = data.map((point) => ({
    value: point.value,
    label: formatChartDate(point.date),
    labelTextStyle: {
      color: COLORS.textMuted,
      fontSize: 10,
      fontFamily: 'Poppins_400Regular',
    },
  }));

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const diff = maxVal - minVal;
  const padding = diff > 0 ? diff * 0.15 : Math.max(0.5, minVal * 0.02);
  const yAxisOffset = Math.max(0, Math.floor((minVal - padding) * 100) / 100);

  return (
    <View
      className="rounded-2xl bg-surface-card p-4 overflow-hidden"
      style={{ borderCurve: 'continuous' }}
    >
      <LineChart
        data={labelledData}
        width={chartWidth}
        height={220}
        spacing={spacing}
        initialSpacing={18}
        endSpacing={24}
        nestedScrollEnabled
        scrollToEnd
        scrollAnimation={false}
        color={COLORS.primary}
        thickness={2.5}
        hideDataPoints={false}
        dataPointsColor={COLORS.primary}
        dataPointsRadius={3}
        startFillColor={`${COLORS.primary}35`}
        endFillColor={`${COLORS.primary}02`}
        areaChart
        curved
        yAxisOffset={yAxisOffset}
        maxValue={maxVal + padding}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor={COLORS.border}
        yAxisLabelWidth={42}
        formatYLabel={(val: string) => {
          const num = parseFloat(val);
          return isNaN(num) ? val : num.toFixed(2);
        }}
        yAxisTextStyle={{
          color: COLORS.textMuted,
          fontSize: 10,
          fontFamily: 'Poppins_400Regular',
        }}
        xAxisLabelTextStyle={{
          color: COLORS.textMuted,
          fontSize: 10,
          fontFamily: 'Poppins_400Regular',
        }}
        rulesType="dashed"
        rulesColor={`${COLORS.border}60`}
        isAnimated
        animationDuration={600}
        pointerConfig={{
          pointerStripColor: COLORS.primary,
          pointerStripWidth: 1.5,
          pointerColor: COLORS.primary,
          radius: 5,
          pointerLabelWidth: 110,
          pointerLabelHeight: 46,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (
            items: Array<{ value: number; label?: string }>,
            _secondaryItems: unknown,
            pointerIndex: number,
          ) => {
            const point = data[pointerIndex];
            return (
              <View
                className="items-center rounded-xl bg-surface-elevated px-2.5 py-1.5 shadow-md border border-border"
                style={{ borderCurve: 'continuous', minWidth: 95 }}
              >
                <Text className="text-xs font-semibold text-primary">
                  {items[0]?.value.toFixed(2)} VES
                </Text>
                {point && (
                  <Text className="text-[10px] text-text-muted">
                    {formatFullDate(point.date)}
                  </Text>
                )}
              </View>
            );
          },
        }}
      />
    </View>
  );
}
