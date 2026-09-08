import { Calendar, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import {
  CurrencyTabSelector,
  PeriodSelector,
} from '@/components/ui/CurrencyTabSelector';
import { PriceChart } from '@/components/ui/PriceChart';
import { PriceHistoryList } from '@/components/ui/PriceHistoryList';
import { StatsRow } from '@/components/ui/StatsRow';
import { useHistoricalRates } from '@/hooks/useHistoricalRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartPeriod, CurrencyCode } from '@/types/currency.types';
import { CURRENCY_NAMES } from '@/utils/constants';

const CHART_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT'];
const PERIODS: ChartPeriod[] = ['1d', '3d', '7d', '30d'];

export default function HistoryScreen() {
  const COLORS = useThemeColors();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [period, setPeriod] = useState<ChartPeriod>('1d');

  const { data, stats, isLoading } = useHistoricalRates(
    selectedCurrency,
    period,
  );

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
    <ScrollView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Currency tabs */}
      <Animated.View entering={FadeIn.duration(300)}>
        <CurrencyTabSelector
          currencies={CHART_CURRENCIES}
          selected={selectedCurrency}
          onSelect={setSelectedCurrency}
        />
      </Animated.View>

      {/* Title + period selector */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(300)}
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
          onSelect={(p) => setPeriod(p as ChartPeriod)}
        />
      </Animated.View>

      {/* Chart */}
      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <PriceChart data={data} isLoading={isLoading} />
      </Animated.View>

      {/* Stats */}
      {!isLoading && data.length > 0 && (
        <StatsRow
          current={stats.current}
          max={stats.max}
          min={stats.min}
          change={stats.change}
        />
      )}

      {/* Price list */}
      {!isLoading && data.length > 0 && (
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <PriceHistoryList data={data} currency={selectedCurrency} />
        </Animated.View>
      )}

      {/* Info */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(300)}
        className="flex-row items-center justify-center gap-1.5 pt-2"
      >
        <Calendar size={13} color={COLORS.textMuted} />
        <Text className="text-xs text-text-muted">
          {getPeriodLabel(period)}
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
