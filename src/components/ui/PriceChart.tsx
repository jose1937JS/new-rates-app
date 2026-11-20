import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LineChart } from 'react-native-gifted-charts';
import { runOnJS } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { ThreeDotsLoader } from '@/components/ui/ThreeDotsLoader';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartDataPoint } from '@/types/currency.types';
import {
  formatChartDate,
  formatFullDate,
  formatFullDateTime,
  formatNumber,
} from '@/utils/formatters';

interface PriceChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const SWIPE_DISTANCE = 55;
const SWIPE_VELOCITY = 450;

export function PriceChart({
  data,
  isLoading,
  onSwipeLeft,
  onSwipeRight,
}: PriceChartProps) {
  const COLORS = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Boolean(onSwipeLeft || onSwipeRight))
        .activeOffsetX([-28, 28])
        .failOffsetY([-18, 18])
        .onEnd((event) => {
          if (event.translationX < -SWIPE_DISTANCE || event.velocityX < -SWIPE_VELOCITY) {
            if (onSwipeLeft) runOnJS(onSwipeLeft)();
          } else if (
            event.translationX > SWIPE_DISTANCE ||
            event.velocityX > SWIPE_VELOCITY
          ) {
            if (onSwipeRight) runOnJS(onSwipeRight)();
          }
        }),
    [onSwipeLeft, onSwipeRight],
  );

  // Available chart width: screen minus container padding (32) minus card padding (32) minus Y-axis width (48)
  const chartWidth = Math.max(220, screenWidth - 112);

  const chartMetrics = useMemo(() => {
    const totalPoints = data.length;
    if (totalPoints === 0) {
      return null;
    }

    const minPointSpacing = totalPoints <= 12 ? 62 : totalPoints <= 48 ? 52 : 40;
    const autoSpacing = totalPoints > 1 ? (chartWidth - 42) / (totalPoints - 1) : chartWidth;
    const spacing = Math.max(minPointSpacing, autoSpacing);
    const totalContentWidth = 18 + Math.max(0, totalPoints - 1) * spacing + 24;
    const isScrollable = totalContentWidth > chartWidth + 4;

    const labelledData = data.map((point) => ({
      value: point.value,
      label: point.label ?? formatChartDate(point.date),
      labelTextStyle: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
      },
    }));

    const isIntradayDataset =
      data.some((d) => d.label?.includes(':')) ||
      new Set(data.map((d) => formatChartDate(d.date))).size < totalPoints;

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const diff = maxVal - minVal;
    const padding = diff > 0 ? diff * 0.15 : Math.max(0.5, minVal * 0.02);
    const yAxisOffset = Math.max(0, Math.floor((minVal - padding) * 100) / 100);
    const maxValue = Math.max(0.5, maxVal + 10 + padding - yAxisOffset);

    return {
      totalPoints,
      spacing,
      isScrollable,
      labelledData,
      isIntradayDataset,
      yAxisOffset,
      maxValue,
    };
  }, [data, chartWidth, COLORS.textMuted]);

  if (isLoading) {
    return (
      <GestureDetector gesture={swipeGesture}>
        <View collapsable={false}>
          <Card noPadding className="h-64 items-center justify-center gap-3">
            <ThreeDotsLoader size={8} color={COLORS.primary} />
            <Text className="text-sm text-text-muted">Cargando gráfico...</Text>
          </Card>
        </View>
      </GestureDetector>
    );
  }

  if (!chartMetrics) {
    return (
      <GestureDetector gesture={swipeGesture}>
        <View collapsable={false}>
          <Card noPadding className="h-64 items-center justify-center">
            <Text className="text-sm text-text-muted">Sin datos disponibles</Text>
          </Card>
        </View>
      </GestureDetector>
    );
  }

  const {
    totalPoints,
    spacing,
    isScrollable,
    labelledData,
    isIntradayDataset,
    yAxisOffset,
    maxValue,
  } = chartMetrics;

  const chartCard = (
    <Card className="overflow-hidden">
      <LineChart
        data={labelledData}
        width={chartWidth}
        height={220}
        spacing={spacing}
        initialSpacing={18}
        endSpacing={24}
        disableScroll={!isScrollable}
        showScrollIndicator={isScrollable}
        indicatorColor={COLORS.isDark ? 'white' : 'black'}
        nestedScrollEnabled
        scrollToEnd
        scrollAnimation={false}
        color={COLORS.primary}
        thickness={2.5}
        hideDataPoints={totalPoints > 36}
        dataPointsColor={COLORS.primary}
        dataPointsRadius={3}
        startFillColor={`${COLORS.primary}35`}
        endFillColor={`${COLORS.primary}02`}
        areaChart
        curved
        yAxisOffset={yAxisOffset}
        maxValue={maxValue}
        noOfSections={4}
        roundToDigits={2}
        yAxisColor="transparent"
        xAxisColor={COLORS.border}
        yAxisLabelWidth={48}
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
        rulesColor={COLORS.isDark ? `${COLORS.border.slice(0, 7)}80` : '#e5e7eb'}
        isAnimated={totalPoints <= 24}
        animationDuration={450}
        pointerConfig={{
          activatePointersOnLongPress: true,
          activatePointersDelay: 180,
          pointerStripColor: COLORS.primary,
          pointerStripWidth: 1.5,
          pointerColor: COLORS.primary,
          radius: 5,
          pointerLabelWidth: 132,
          pointerLabelHeight: 48,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (
            items: Array<{ value: number; label?: string }>,
            _secondaryItems: unknown,
            pointerIndex: number,
          ) => {
            const point = data[pointerIndex];
            const displayValue = point ? point.value : (items[0]?.value ?? 0);
            return (
              <View
                className="items-center rounded-xl border border-border bg-surface-elevated px-2.5 py-1.5 shadow-md"
                style={{ borderCurve: 'continuous', minWidth: 112 }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: COLORS.primary }}
                >
                  {formatNumber(displayValue, 2)} VES
                </Text>
                {point && (
                  <Text className="text-[10px] text-text-muted">
                    {isIntradayDataset
                      ? formatFullDateTime(point.date)
                      : formatFullDate(point.date)}
                  </Text>
                )}
              </View>
            );
          },
        }}
      />
      <Text className="mt-2 text-center text-[10px] text-text-muted">
        {isScrollable
          ? 'Desliza el gráfico para explorar • Mantén presionado un punto'
          : 'Mantén presionado un punto para ver el detalle'}
      </Text>
    </Card>
  );

  if (isScrollable) {
    return chartCard;
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <View collapsable={false}>{chartCard}</View>
    </GestureDetector>
  );
}
