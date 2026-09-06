import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import {
  CurrencyTabSelector,
  PeriodSelector,
} from '@/components/ui/CurrencyTabSelector';
import { PriceChart } from '@/components/ui/PriceChart';
import { StatsRow } from '@/components/ui/StatsRow';
import { useHistoricalRates } from '@/hooks/useHistoricalRates';
import type { ChartPeriod, CurrencyCode } from '@/types/currency.types';
import { CURRENCY_NAMES } from '@/utils/constants';

const CHART_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT'];
const PERIODS: ChartPeriod[] = ['7d', '30d'];

export default function HistoryScreen() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [period, setPeriod] = useState<ChartPeriod>('30d');

  const { data, stats, isLoading } = useHistoricalRates(
    selectedCurrency,
    period,
  );

  return (
    <ScrollView
      className="flex-1 bg-surface"
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
        <View>
          <Text className="text-lg font-bold text-text-primary">
            {CURRENCY_NAMES[selectedCurrency]}
          </Text>
          <Text className="text-sm text-text-secondary">
            Evolución del precio en VES
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

      {/* Info */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(300)}
        className="items-center pt-2"
      >
        <Text className="text-xs text-text-muted">
          Datos de los últimos {period === '7d' ? '7' : '30'} días
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
