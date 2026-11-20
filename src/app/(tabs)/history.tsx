import * as Haptics from 'expo-haptics';
import { Calendar, TrendingUp } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CurrencyTabSelector,
  PeriodSelector,
} from '@/components/ui/CurrencyTabSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineBadge } from '@/components/ui/OfflineBadge';
import { PriceChart } from '@/components/ui/PriceChart';
import { PriceHistoryList } from '@/components/ui/PriceHistoryList';
import { PullToRefreshScrollView } from '@/components/ui/PullToRefreshScrollView';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { StatsRow } from '@/components/ui/StatsRow';
import { useHistoricalRates } from '@/hooks/useHistoricalRates';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartPeriod, CurrencyCode } from '@/types/currency.types';
import { CURRENCY_NAMES } from '@/utils/constants';

const CHART_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT'];
const PERIODS: ChartPeriod[] = ['1d', '3d', '7d', '30d'];
const SWIPE_DISTANCE = 55;
const SWIPE_VELOCITY = 450;

function createCurrencySwipeGesture(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
) {
  return Gesture.Pan()
    .activeOffsetX([-28, 28])
    .failOffsetY([-18, 18])
    .onEnd((event) => {
      if (event.translationX < -SWIPE_DISTANCE || event.velocityX < -SWIPE_VELOCITY) {
        runOnJS(onSwipeLeft)();
      } else if (
        event.translationX > SWIPE_DISTANCE ||
        event.velocityX > SWIPE_VELOCITY
      ) {
        runOnJS(onSwipeRight)();
      }
    });
}

export default function HistoryScreen() {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isOnline } = useOfflineStatus();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [period, setPeriod] = useState<ChartPeriod>('1d');

  const slideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  const transitionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.get() }],
    opacity: contentOpacity.get(),
  }));

  const triggerSlide = useCallback(
    (direction: 1 | -1) => {
      slideX.set(
        withSequence(
          withTiming(direction * 18, { duration: 0 }),
          withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }),
        ),
      );
      contentOpacity.set(
        withSequence(
          withTiming(0.45, { duration: 0 }),
          withTiming(1, { duration: 240 }),
        ),
      );
    },
    [contentOpacity, slideX],
  );

  const handleCurrencySelect = (nextCurrency: CurrencyCode) => {
    if (nextCurrency === selectedCurrency) return;
    const prevIdx = CHART_CURRENCIES.indexOf(selectedCurrency);
    const nextIdx = CHART_CURRENCIES.indexOf(nextCurrency);
    triggerSlide(nextIdx >= prevIdx ? 1 : -1);
    setSelectedCurrency(nextCurrency);
  };

  const handleSwipeNext = useCallback(() => {
    const idx = CHART_CURRENCIES.indexOf(selectedCurrency);
    if (idx < CHART_CURRENCIES.length - 1) {
      void Haptics.selectionAsync();
      triggerSlide(1);
      setSelectedCurrency(CHART_CURRENCIES[idx + 1]);
    }
  }, [selectedCurrency, triggerSlide]);

  const handleSwipePrev = useCallback(() => {
    const idx = CHART_CURRENCIES.indexOf(selectedCurrency);
    if (idx > 0) {
      void Haptics.selectionAsync();
      triggerSlide(-1);
      setSelectedCurrency(CHART_CURRENCIES[idx - 1]);
    }
  }, [selectedCurrency, triggerSlide]);

  const heroSwipeGesture = useMemo(
    () => createCurrencySwipeGesture(handleSwipeNext, handleSwipePrev),
    [handleSwipeNext, handleSwipePrev],
  );
  const headerSwipeGesture = useMemo(
    () => createCurrencySwipeGesture(handleSwipeNext, handleSwipePrev),
    [handleSwipeNext, handleSwipePrev],
  );
  const bodySwipeGesture = useMemo(
    () => createCurrencySwipeGesture(handleSwipeNext, handleSwipePrev),
    [handleSwipeNext, handleSwipePrev],
  );

  const handlePeriodSelect = (nextPeriod: string) => {
    const typedPeriod = nextPeriod as ChartPeriod;
    if (typedPeriod === period) return;
    const prevIdx = PERIODS.indexOf(period);
    const nextIdx = PERIODS.indexOf(typedPeriod);
    triggerSlide(nextIdx >= prevIdx ? 1 : -1);
    setPeriod(typedPeriod);
  };

  const { data, stats, isLoading, isFetching, isError, refetch } =
    useHistoricalRates(selectedCurrency, period);

  const getPeriodLabel = (p: ChartPeriod) => {
    switch (p) {
      case '1d':
        return 'Datos de las últimas 24 horas';
      case '3d':
        return 'Datos de los últimos 3 días';
      case '7d':
        return 'Datos de los últimos 7 días';
      case '30d':
        return 'Datos de los últimos 30 días';
    }
  };

  return (
    <View className="flex-1 bg-surface" style={{ backgroundColor: COLORS.surface }}>
      {/* Fixed compact orange Hero with embedded Currency tabs (swipeable) */}
      <GestureDetector gesture={heroSwipeGesture}>
        <View collapsable={false}>
          <ScreenHero
            title="Historial"
            subtitle="Evolución histórica en VES"
            icon={<TrendingUp size={20} color="#ffffff" />}
            rightElement={<OfflineBadge isOnline={isOnline} variant="hero" />}
          >
            <CurrencyTabSelector
              currencies={CHART_CURRENCIES}
              selected={selectedCurrency}
              onSelect={handleCurrencySelect}
              variant="hero"
            />
          </ScreenHero>
        </View>
      </GestureDetector>

      <PullToRefreshScrollView
        containerClassName="flex-1"
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 104 + insets.bottom,
          gap: 16,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Title + animated period selector */}
        <GestureDetector gesture={headerSwipeGesture}>
          <Animated.View
            collapsable={false}
            entering={FadeInUp.delay(80).duration(300)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-1.5">
                <TrendingUp size={18} color={COLORS.primary} />
                <Text
                  className="text-lg font-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {CURRENCY_NAMES[selectedCurrency]}
                </Text>
              </View>
              <Text className="text-xs text-text-secondary">
                Evolución en VES
              </Text>
            </View>
            <PeriodSelector
              periods={PERIODS}
              selected={period}
              onSelect={handlePeriodSelect}
            />
          </Animated.View>
        </GestureDetector>

        {/* Animated content region when switching currency or period */}
        <Animated.View style={transitionStyle} className="gap-4">
          {!isLoading && data.length === 0 && isError ? (
            <GestureDetector gesture={bodySwipeGesture}>
              <View collapsable={false}>
                <EmptyState
                  isError={isError}
                  isRetrying={isFetching}
                  onRetry={refetch}
                  title="No pudimos cargar el historial"
                  message={
                    !isOnline
                      ? 'No tienes conexión a internet y no hay historial guardado para esta moneda.'
                      : 'Ocurrió un problema al consultar el historial. Inténtalo de nuevo.'
                  }
                />
              </View>
            </GestureDetector>
          ) : (
            <>
              <PriceChart
                data={data}
                isLoading={isLoading}
                onSwipeLeft={handleSwipeNext}
                onSwipeRight={handleSwipePrev}
              />

              <GestureDetector gesture={bodySwipeGesture}>
                <View collapsable={false} className="gap-4">
                  {!isLoading && data.length > 0 && (
                    <StatsRow
                      current={stats.current}
                      max={stats.max}
                      min={stats.min}
                      change={stats.change}
                    />
                  )}

                  {!isLoading && data.length > 0 && (
                    <PriceHistoryList data={data} currency={selectedCurrency} />
                  )}

                  {/* Info */}
                  <View className="flex-row items-center justify-center gap-1.5 pt-1">
                    <Calendar size={13} color={COLORS.textMuted} />
                    <Text className="text-xs text-text-muted">
                      {getPeriodLabel(period)}
                    </Text>
                  </View>
                </View>
              </GestureDetector>
            </>
          )}
        </Animated.View>

        {!isLoading && data.length === 0 && isError && (
          <View className="flex-row items-center justify-center gap-1.5 pt-1">
            <Calendar size={13} color={COLORS.textMuted} />
            <Text className="text-xs text-text-muted">
              {getPeriodLabel(period)}
            </Text>
          </View>
        )}
      </PullToRefreshScrollView>
    </View>
  );
}
