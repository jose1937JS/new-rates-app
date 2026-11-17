import { Calendar, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
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
import { ScreenHero } from '@/components/ui/ScreenHero';
import { StatsRow } from '@/components/ui/StatsRow';
import { useHistoricalRates } from '@/hooks/useHistoricalRates';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartPeriod, CurrencyCode } from '@/types/currency.types';
import { CURRENCY_NAMES } from '@/utils/constants';

const CHART_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT'];
const PERIODS: ChartPeriod[] = ['1d', '3d', '7d', '30d'];

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

  const triggerSlide = (direction: 1 | -1) => {
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
  };

  const handleCurrencySelect = (nextCurrency: CurrencyCode) => {
    if (nextCurrency === selectedCurrency) return;
    const prevIdx = CHART_CURRENCIES.indexOf(selectedCurrency);
    const nextIdx = CHART_CURRENCIES.indexOf(nextCurrency);
    triggerSlide(nextIdx >= prevIdx ? 1 : -1);
    setSelectedCurrency(nextCurrency);
  };

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
      {/* Fixed compact orange Hero with embedded Currency tabs */}
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 104 + insets.bottom,
          gap: 16,
        }}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Title + animated period selector */}
        <Animated.View
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

        {/* Animated content region when switching currency or period */}
        <Animated.View style={transitionStyle} className="gap-4">
          {!isLoading && data.length === 0 && isError ? (
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
          ) : (
            <>
              <PriceChart data={data} isLoading={isLoading} />

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
            </>
          )}
        </Animated.View>

        {/* Info */}
        <View className="flex-row items-center justify-center gap-1.5 pt-1">
          <Calendar size={13} color={COLORS.textMuted} />
          <Text className="text-xs text-text-muted">
            {getPeriodLabel(period)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
