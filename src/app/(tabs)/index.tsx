import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { OfflineBadge } from '@/components/ui/OfflineBadge';
import { RateCard } from '@/components/ui/RateCard';
import { useConversion } from '@/hooks/useConversion';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCurrencyStore } from '@/store/currencyStore';
import type { CurrencyCode } from '@/types/currency.types';
import { formatRelativeTime, parseFormattedNumber } from '@/utils/formatters';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DISPLAY_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT'];

export default function ConverterScreen() {
  const { selectedCurrency, amount, setSelectedCurrency, setAmount } = useCurrencyStore();
  const { rates, isLoading, isFetching, dataUpdatedAt } = useCurrencyRates();
  const { isOnline } = useOfflineStatus();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  const numericAmount = amount ? parseFormattedNumber(amount) : 0;
  const conversions = useConversion(numericAmount, selectedCurrency, rates);

  // Currencies to show as cards (exclude the one currently selected in the input)
  const cardCurrencies =
    selectedCurrency === 'VES'
      ? DISPLAY_CURRENCIES
      : (['VES', ...DISPLAY_CURRENCIES.filter((c) => c !== selectedCurrency)] as CurrencyCode[]);

  const handleCardPress = (currency: CurrencyCode) => {
    if (currency === selectedCurrency) return;
    // Swap: the card currency becomes the input currency
    const currentConverted = conversions[currency];
    setSelectedCurrency(currency);
    setAmount(currentConverted > 0 ? currentConverted.toFixed(2) : '');
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

  return (
    <ScrollView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      contentContainerStyle={{
        padding: 16,
        gap: 16,
        paddingBottom: 32,
        paddingTop: isAndroid ? insets.top : 0
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-primary">
            Cambio Digital
          </Text>
          {isFetching && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>
        <View className="items-end gap-1">
          <OfflineBadge isOnline={isOnline} />
        </View>
      </Animated.View>

      {/* Loading state */}
      {isLoading && !rates && (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 text-text-secondary">
            Obteniendo tasas de cambio...
          </Text>
        </View>
      )}

      {/* Main input */}
      {rates && (
        <>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <CurrencyInput
              value={amount}
              currency={selectedCurrency}
              onChangeText={setAmount}
            />
          </Animated.View>

          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-medium text-primary">
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
            entering={FadeInDown.delay(400).duration(400)}
            className="items-center pt-2"
          >
            <Text className="text-xs text-text-muted">
              Tasas: BCV (USD/EUR) • Binance P2P (USDT)
            </Text>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}
