import { Info } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppModal } from '@/components/ui/AppModal';
import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { OfflineBadge } from '@/components/ui/OfflineBadge';
import { ThreeDotsLoader } from '@/components/ui/ThreeDotsLoader';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode, UnifiedRates } from '@/types/currency.types';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { triggerSelectionHaptic } from '@/utils/haptics';

const APP_LOGO = require('@/assets/images/logo.webp');

interface RatesHeroProps {
  rates: UnifiedRates | null;
  isLoading: boolean;
  isFetching: boolean;
  isOnline: boolean;
}

type HeroCurrencyCode = Extract<CurrencyCode, 'USD' | 'EUR' | 'USDT'>;

interface HeroRateItem {
  code: HeroCurrencyCode;
  source: string;
  rate: number;
  change: number;
}

interface RateInfoContent {
  title: string;
  message: string;
}

const RATE_INFO_BY_CURRENCY: Record<HeroCurrencyCode, RateInfoContent> = {
  USD: {
    title: 'Dólar oficial (BCV)',
    message: 'Es la tasa de referencia oficial publicada por el Banco Central de Venezuela.\n\nSe calcula cada día hábil como el promedio ponderado de las operaciones reales de compra y venta de divisas en las mesas de cambio de los bancos del país. Durante fines de semana y feriados se mantiene vigente el último valor publicado.',
  },
  EUR: {
    title: 'Euro oficial (BCV)',
    message: 'Es la tasa oficial del euro publicada por el Banco Central de Venezuela.\n\nParte del promedio ponderado de las operaciones en las mesas de cambio bancarias del país y se ajusta según la paridad oficial entre el euro y el dólar en los mercados internacionales. En fines de semana y feriados conserva la última tasa publicada.',
  },
  USDT: {
    title: 'USDT de referencia (Yadio)',
    message: 'Es una tasa de referencia del mercado de intercambio entre personas (P2P) obtenida desde Yadio.\n\nYadio la calcula promediando los anuncios activos de compra y venta de USDT por bolívares y filtrando valores extremos para reflejar el precio real del mercado. Se actualiza de forma periódica todos los días, incluso fines de semana y feriados.',
  },
};

export function RatesHero({
  rates,
  isLoading,
  isFetching,
  isOnline,
}: RatesHeroProps) {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const [selectedInfo, setSelectedInfo] = useState<HeroCurrencyCode | null>(
    null,
  );

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

  const handleCardPress = (code: HeroCurrencyCode) => {
    triggerSelectionHaptic();
    setSelectedInfo(code);
  };

  const activeInfo = selectedInfo ? RATE_INFO_BY_CURRENCY[selectedInfo] : null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        backgroundColor: COLORS.primary,
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 80,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        borderCurve: 'continuous',
      }}
    >
      {/* Header row */}
      <View className="mb-4 flex-row items-center justify-between gap-2">
        <View className="mb-2 flex-1 flex-row items-center gap-2">
          <Image
            source={APP_LOGO}
            style={{ width: 40, height: 40, }}
            resizeMode="contain"
          />
          <Text
            className="flex-1 text-2xl font-bold text-white"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            RATESVEN
          </Text>
        </View>
        <View className="items-end">
          <OfflineBadge isOnline={isOnline} variant="hero" />
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
              className="flex-1"
            >
              <Pressable
                onPress={() => handleCardPress(item.code)}
                accessibilityRole="button"
                accessibilityLabel={`Ver información sobre la tasa ${item.code} ${item.source}`}
                className="rounded-2xl p-3 active:opacity-85"
                style={{
                  backgroundColor: COLORS.surfaceCard,
                  borderCurve: 'continuous',
                }}
              >
                <View className="mb-1.5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <CurrencyIcon currency={item.code} size={15} />
                    <Text className="text-xs font-semibold text-text-primary">
                      {item.code}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-medium text-text-muted">
                    {item.source}
                  </Text>
                </View>

                {isLoading && !rates ? (
                  <View className="flex-row items-center justify-between pt-1">
                    <ThreeDotsLoader size={5} color={COLORS.textMuted} />
                    <Info size={12} color={COLORS.textMuted} />
                  </View>
                ) : (
                  <>
                    <Text
                      className="text-sm font-semibold text-text-primary"
                      style={{ fontVariant: ['tabular-nums'] }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {item.rate > 0 ? `${formatNumber(item.rate, 2)} Bs` : '--'}
                    </Text>
                    <View className="mt-0.5 flex-row items-center justify-between gap-1">
                      <Text
                        className={`text-[10px] font-semibold ${
                          item.rate <= 0
                            ? 'text-text-muted'
                            : isPositive
                              ? 'text-success'
                              : 'text-danger'
                        }`}
                        style={{ fontVariant: ['tabular-nums'] }}
                        numberOfLines={1}
                      >
                        {item.rate > 0
                          ? formatPercentage(item.change)
                          : 'No disp.'}
                      </Text>
                      <Info size={12} color={COLORS.textMuted} />
                    </View>
                  </>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <AppModal
        visible={activeInfo !== null}
        title={activeInfo?.title ?? ''}
        message={activeInfo?.message ?? ''}
        variant="info"
        confirmText="Entendido"
        onClose={() => setSelectedInfo(null)}
      />
    </Animated.View>
  );
}
