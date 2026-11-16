import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBadge } from '@/components/ui/OfflineBadge';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode, UnifiedRates } from '@/types/currency.types';
import { CURRENCY_FLAGS } from '@/utils/constants';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface RatesHeroProps {
  rates: UnifiedRates | null;
  isLoading: boolean;
  isFetching: boolean;
  isOnline: boolean;
}

interface HeroRateItem {
  code: CurrencyCode;
  source: string;
  rate: number;
  change: number;
}

export function RatesHero({
  rates,
  isLoading,
  isFetching,
  isOnline,
}: RatesHeroProps) {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();

  const items: HeroRateItem[] = [
    {
      code: 'USD',
      source: 'BCV',
      rate: rates?.usd.rateToVes ?? 0,
      change: rates?.usd.changePercentage ?? 0,
    },
    {
      code: 'EUR',
      source: 'BCV',
      rate: rates?.eur.rateToVes ?? 0,
      change: rates?.eur.changePercentage ?? 0,
    },
    {
      code: 'USDT',
      source: 'Yadio',
      rate: rates?.usdt.rateToVes ?? 0,
      change: rates?.usdt.changePercentage ?? 0,
    },
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        backgroundColor: COLORS.primary,
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 80,
        // borderBottomLeftRadius: 28,
        // borderBottomRightRadius: 28,
        // borderCurve: 'continuous',
      }}
    >
      {/* Header row */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-3xl font-bold text-white">
            RATES VENAPP
          </Text>
          {isFetching && <ActivityIndicator size="small" color="#ffffff" />}
        </View>
        <View className="items-end">
          {!isOnline ? (
            <OfflineBadge isOnline={isOnline} variant="hero" />
          ) : (
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Text className="text-[11px] font-semibold text-white">
                Tasas hoy
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 3 quick-verification rate cards */}
      <View className="flex-row gap-2.5">
        {items.map((item, index) => {
          const isPositive = item.change >= 0;
          return (
            <Animated.View
              key={item.code}
              entering={FadeInDown.delay(index * 60).duration(350)}
              className="flex-1 rounded-2xl p-3"
              style={{
                backgroundColor: COLORS.surfaceCard,
                borderCurve: 'continuous',
              }}
            >
              <View className="mb-1.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm">{CURRENCY_FLAGS[item.code]}</Text>
                  <Text className="text-xs font-semibold text-text-primary">
                    {item.code}
                  </Text>
                </View>
                <Text className="text-[10px] font-medium text-text-muted">
                  {item.source}
                </Text>
              </View>

              {isLoading && !rates ? (
                <Text className="text-sm font-semibold text-text-muted">
                  ...
                </Text>
              ) : (
                <>
                  <Text
                    className="text-sm font-bold text-text-primary"
                    style={{ fontVariant: ['tabular-nums'] }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    selectable
                  >
                    {item.rate > 0 ? `${formatNumber(item.rate, 2)} Bs` : '--'}
                  </Text>
                  <Text
                    className={`mt-0.5 text-[10px] font-semibold ${
                      item.rate <= 0
                        ? 'text-text-muted'
                        : isPositive
                          ? 'text-success'
                          : 'text-danger'
                    }`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {item.rate > 0 ? formatPercentage(item.change) : 'No disp.'}
                  </Text>
                </>
              )}
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}
