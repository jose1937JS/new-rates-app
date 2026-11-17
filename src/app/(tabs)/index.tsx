import { ArrowLeftRight } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConverterSkeleton } from '@/components/ui/ConverterSkeleton';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineBadge } from '@/components/ui/OfflineBadge';
import { PullToRefreshScrollView } from '@/components/ui/PullToRefreshScrollView';
import { RateCard } from '@/components/ui/RateCard';
import { RatesHero } from '@/components/ui/RatesHero';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { ThreeDotsLoader } from '@/components/ui/ThreeDotsLoader';
import { convertAmount, useConversion } from '@/hooks/useConversion';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCurrencyStore } from '@/store/currencyStore';
import type { CurrencyCode } from '@/types/currency.types';
import { formatRelativeTime, parseFormattedNumber } from '@/utils/formatters';

const ALL_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT', 'VES'];
const DEBOUNCE_MS = 300;

export default function ConverterScreen() {
  const { selectedCurrency, amount, setSelectedCurrency, setAmount } = useCurrencyStore();
  const {
    rates,
    hasFallback,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useCurrencyRates();
  const { isOnline } = useOfflineStatus();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();

  const [inputValue, setInputValue] = useState(amount);
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => Boolean(rates));
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading]);

  const showInitialSkeleton = isLoading && !rates && !hasLoadedOnce;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleAmountChange = useCallback(
    (nextText: string) => {
      setInputValue(nextText);
      setAmount(nextText);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedAmount(nextText);
      }, DEBOUNCE_MS);
    },
    [setAmount],
  );

  const handleClearAmount = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInputValue('1');
    setAmount('1');
    setDebouncedAmount('1');
  }, [setAmount]);

  const numericAmount = debouncedAmount ? parseFormattedNumber(debouncedAmount) : 0;
  const conversions = useConversion(numericAmount, selectedCurrency, rates);

  // Always show all 4 currencies: active one in input, remaining 3 as cards
  const cardCurrencies: CurrencyCode[] =
    selectedCurrency === 'VES'
      ? ['USD', 'EUR', 'USDT']
      : ['VES', ...ALL_CURRENCIES.filter((c) => c !== selectedCurrency && c !== 'VES')];

  const handleCardPress = (currency: CurrencyCode) => {
    if (currency === selectedCurrency) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const immediateAmount = inputValue ? parseFormattedNumber(inputValue) : 0;
    const nextConverted = convertAmount(immediateAmount, selectedCurrency, rates)[currency];
    const nextValue = nextConverted > 0 ? nextConverted.toFixed(2) : '';

    setSelectedCurrency(currency);
    setAmount(nextValue);
    setInputValue(nextValue);
    setDebouncedAmount(nextValue);
  };

  const getRate = (code: CurrencyCode): number => {
    if (!rates) return 0;
    switch (code) {
      case 'USD':
        return rates.usd.rateToVes;
      case 'EUR':
        return rates.eur.rateToVes;
      case 'USDT':
        return rates.usdt.rateToVes;
      default:
        return 1;
    }
  };

  const getChange = (code: CurrencyCode): number => {
    if (!rates) return 0;
    switch (code) {
      case 'USD':
        return rates.usd.changePercentage;
      case 'EUR':
        return rates.eur.changePercentage;
      case 'USDT':
        return rates.usdt.changePercentage;
      default:
        return 0;
    }
  };

  if (showInitialSkeleton) {
    return <ConverterSkeleton />;
  }

  if (!rates) {
    return (
      <View
        className="flex-1 bg-surface"
        style={{ backgroundColor: COLORS.surface }}
      >
        <ScreenHero
          title="RATES VENAPP"
          subtitle="Tasas de cambio en Venezuela"
          icon={<ArrowLeftRight size={20} color="#ffffff" />}
          rightElement={
            !isOnline ? (
              <OfflineBadge isOnline={isOnline} variant="hero" />
            ) : undefined
          }
        />

        <PullToRefreshScrollView
          containerClassName="flex-1"
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 104 + insets.bottom,
          }}
          contentInsetAdjustmentBehavior="never"
        >
          {isLoading ? (
            <View className="items-center py-12">
              <ThreeDotsLoader size={10} color={COLORS.primary} />
              <Text className="mt-3 text-text-secondary">
                Obteniendo tasas de cambio...
              </Text>
            </View>
          ) : (
            <EmptyState
              isError={isError}
              isRetrying={isFetching}
              onRetry={refetch}
              title={
                !isOnline
                  ? 'Sin conexión a internet'
                  : isError
                    ? 'No pudimos cargar las tasas'
                    : 'Sin datos disponibles'
              }
              message={
                !isOnline
                  ? 'No tienes conexión a internet y no hay tasas guardadas en caché todavía.'
                  : isError
                    ? 'Ocurrió un problema al conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
                    : 'Aún no hay tasas de cambio registradas. Vuelve a intentarlo en unos minutos.'
              }
            />
          )}
        </PullToRefreshScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ backgroundColor: COLORS.surface }}>
      {/* Fixed orange rounded-bottom Hero with 3 quick-verification rate cards */}
      <RatesHero
        rates={rates}
        isLoading={isLoading}
        isFetching={isFetching}
        isOnline={isOnline}
      />

      <PullToRefreshScrollView
        containerClassName="flex-1 -mt-20"
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 0,
          paddingBottom: 104 + insets.bottom,
          gap: 16,
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
      >
        {/* Main converter */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <CurrencyInput
            value={inputValue}
            currency={selectedCurrency}
            onChangeText={handleAmountChange}
            onClear={handleClearAmount}
          />
        </Animated.View>

        <View className="flex-row items-center justify-between">
          <Text
            className="text-lg font-medium"
            style={{ color: COLORS.primary }}
          >
            Conversiones
          </Text>
          <View className="flex-row items-center gap-1">
            {dataUpdatedAt > 0 && (
              <Text className="text-xs text-text-muted">
                Actualizado {formatRelativeTime(new Date(dataUpdatedAt))}
              </Text>
            )}
          </View>
        </View>

        {/* Conversion cards */}
        <View className="gap-3">
          {cardCurrencies.map((currency, index) => (
            <RateCard
              key={currency}
              currency={currency}
              convertedAmount={conversions[currency]}
              rate={currency === 'VES' ? 1 : getRate(currency)}
              changePercentage={currency === 'VES' ? 0 : getChange(currency)}
              onPress={() => handleCardPress(currency)}
              isSelected={false}
              index={index}
            />
          ))}
        </View>

        {/* Rate source info */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="items-center pt-2"
        >
          <Text className="text-xs text-text-muted">
            Tasas: BCV (USD/EUR) • Yadio (USDT)
          </Text>
          {hasFallback && (
            <Text className="mt-0.5 text-[11px] text-text-muted">
              Mostrando última tasa BCV disponible
            </Text>
          )}
          {!isOnline && (
            <Text className="mt-0.5 text-[11px] text-text-muted">
              Modo sin conexión • Mostrando consulta guardada
            </Text>
          )}
        </Animated.View>
      </PullToRefreshScrollView>
    </View>
  );
}
