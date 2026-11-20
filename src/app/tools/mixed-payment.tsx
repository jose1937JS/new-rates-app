import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  Copy,
  CreditCard,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { Card } from '@/components/ui/Card';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { RateSourceSelector } from '@/components/ui/RateSourceSelector';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useEffectiveRates } from '@/hooks/useEffectiveRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCurrencyStore } from '@/store/currencyStore';
import type { CurrencyCode, RateSourceId } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { computeMixedPayment } from '@/utils/fiscalUtils';
import {
  formatBankAmount,
  formatNumber,
  parseFormattedNumber,
} from '@/utils/formatters';
import { triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import { copyToClipboard } from '@/utils/shareUtils';
import { sanitizeDecimalInput } from '@/utils/shoppingUtils';

interface CashRowDraft {
  id: string;
  amountText: string;
  currency: Exclude<CurrencyCode, 'VES'>;
}

const FOREIGN_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT'];

function createRowId(): string {
  return `cash-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function MixedPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    currency?: string;
  }>();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { snapshot, sourceOptions } = useEffectiveRates();
  const fiscalSettings = useCurrencyStore((state) => state.fiscalSettings);

  const initialCurrency: CurrencyCode =
    params.currency === 'USD' ||
    params.currency === 'EUR' ||
    params.currency === 'USDT' ||
    params.currency === 'VES'
      ? params.currency
      : 'USD';

  const [totalText, setTotalText] = useState(params.amount ?? '');
  const [totalCurrency, setTotalCurrency] =
    useState<CurrencyCode>(initialCurrency);
  const [rateSource, setRateSource] = useState<RateSourceId>('BCV_USD');
  const [applyIgtf, setApplyIgtf] = useState(true);
  const [cashRows, setCashRows] = useState<CashRowDraft[]>([
    { id: 'cash-1', amountText: '', currency: 'USD' },
  ]);

  const totalAmount = totalText ? parseFormattedNumber(totalText) : 0;

  const result = computeMixedPayment({
    totalAmount,
    totalCurrency,
    rateSource,
    snapshot,
    cashEntries: cashRows.map((row) => ({
      id: row.id,
      amount: row.amountText ? parseFormattedNumber(row.amountText) : 0,
      currency: row.currency,
    })),
    applyIgtf,
    igtfPercent: fiscalSettings.igtfPercent,
  });

  const addCashRow = () => {
    triggerSelectionHaptic();
    setCashRows((prev) => [
      ...prev,
      { id: createRowId(), amountText: '', currency: 'USD' },
    ]);
  };

  const updateCashRow = (id: string, patch: Partial<CashRowDraft>) => {
    setCashRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeCashRow = (id: string) => {
    triggerSelectionHaptic();
    setCashRows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.id !== id) : prev,
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHero
        title="Pago mixto + IGTF"
        subtitle="Calcula cuánto falta en Bolívares o el vuelto"
        leftAction={
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderCurve: 'continuous',
            }}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
        }
      >
        <View className="mt-1 items-center rounded-2xl bg-black/15 px-4 py-3">
          <Text className="text-[11px] font-medium text-white/80">
            {result.changeVes > 0
              ? 'Vuelto a entregar al cliente'
              : 'Falta por pagar en Bolívares (Pago Móvil)'}
          </Text>
          <Text
            className="mt-0.5 text-3xl font-bold text-white"
            style={{ fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {result.changeVes > 0
              ? `${formatNumber(result.changeVes)} Bs`
              : `${formatNumber(result.remainingVes)} Bs`}
          </Text>
          <Text
            className="mt-0.5 text-xs font-medium text-white/85"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            Equivalente: ${' '}
            {formatNumber(
              result.changeVes > 0
                ? result.changeInRefUsd
                : result.remainingInRefUsd,
            )}{' '}
            ({result.referenceLabel})
          </Text>
        </View>
      </ScreenHero>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          gap: 14,
        }}
      >
        {/* Total de factura */}
        <Card title="1. Total de la cuenta o factura">
          <View className="gap-3">
            <CurrencyChipRow
              selected={totalCurrency}
              onSelect={setTotalCurrency}
            />
            <View className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
              <Text
                className="text-lg font-bold"
                style={{ color: COLORS.primary }}
              >
                {CURRENCY_SYMBOLS[totalCurrency]}
              </Text>
              <TextInput
                value={totalText}
                onChangeText={(txt) =>
                  setTotalText(sanitizeDecimalInput(txt, totalText))
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                className="flex-1"
                style={singleLineInputStyle({
                  color: COLORS.textPrimary,
                  fontSize: 20,
                  height: 48,
                  weight: 'bold',
                  tabularNums: true,
                })}
              />
              <ClearInputButton
                visible={totalText.length > 0}
                onPress={() => setTotalText('')}
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-medium text-text-secondary">
                Tasa de referencia para el saldo en Bs:
              </Text>
              <RateSourceSelector
                options={sourceOptions}
                selected={rateSource}
                onSelect={setRateSource}
              />
            </View>
          </View>
        </Card>

        {/* Efectivo entregado en divisas */}
        <Card
          title="2. Entrega en efectivo (divisas)"
          icon={<Banknote size={16} color={COLORS.primary} />}
          headerRight={
            <Pressable
              onPress={addCashRow}
              className="flex-row items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-1 active:opacity-75"
            >
              <Plus size={13} color={COLORS.primary} />
              <Text
                className="text-xs font-medium"
                style={{ color: COLORS.primary }}
              >
                Agregar billete
              </Text>
            </Pressable>
          }
        >
          <View className="gap-3">
            {cashRows.map((row) => (
              <View
                key={row.id}
                className="gap-2 rounded-xl bg-surface-elevated p-3"
              >
                <View className="h-10 flex-row items-center gap-2">
                  <Text
                    className="text-base font-bold"
                    style={{ color: COLORS.primary }}
                  >
                    {CURRENCY_SYMBOLS[row.currency]}
                  </Text>
                  <TextInput
                    value={row.amountText}
                    onChangeText={(txt) =>
                      updateCashRow(row.id, {
                        amountText: sanitizeDecimalInput(txt, row.amountText),
                      })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    className="flex-1"
                    style={singleLineInputStyle({
                      color: COLORS.textPrimary,
                      fontSize: 16,
                      height: 40,
                      weight: 'bold',
                      tabularNums: true,
                    })}
                  />
                  <ClearInputButton
                    visible={row.amountText.length > 0}
                    onPress={() => updateCashRow(row.id, { amountText: '' })}
                  />
                  {cashRows.length > 1 && (
                    <Pressable
                      onPress={() => removeCashRow(row.id)}
                      hitSlop={6}
                      className="rounded-lg bg-danger/10 p-1.5 active:opacity-75"
                    >
                      <Trash2 size={14} color={COLORS.danger} />
                    </Pressable>
                  )}
                </View>

                <CurrencyChipRow
                  selected={row.currency}
                  currencies={FOREIGN_CURRENCIES}
                  onSelect={(c) =>
                    updateCashRow(row.id, {
                      currency: c as Exclude<CurrencyCode, 'VES'>,
                    })
                  }
                />
              </View>
            ))}

            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                setApplyIgtf((prev) => !prev);
              }}
              className="flex-row items-center justify-between border-t pt-3"
              style={{ borderColor: COLORS.border }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-text-primary">
                  Aplicar IGTF ({fiscalSettings.igtfPercent}%)
                </Text>
                <Text className="text-xs text-text-muted">
                  Se calcula solo sobre el efectivo en divisas
                </Text>
              </View>
              <Switch
                value={applyIgtf}
                onValueChange={(next) => {
                  triggerSelectionHaptic();
                  setApplyIgtf(next);
                }}
                trackColor={{
                  false: COLORS.border,
                  true: `${COLORS.primary}80`,
                }}
                thumbColor={applyIgtf ? COLORS.primary : COLORS.textMuted}
              />
            </Pressable>
          </View>
        </Card>

        {/* Desglose y acciones rápidas */}
        <Card title="Resumen detallado">
          <View className="gap-2 mt-3">
            <View className="flex-row justify-between">
              <Text className="text-xs text-text-secondary">Total base:</Text>
              <Text
                className="text-xs font-semibold text-text-primary"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatNumber(result.totalVes)} Bs
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-text-secondary">
                Efectivo abonado:
              </Text>
              <Text
                className="text-xs font-semibold text-text-primary"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                -{formatNumber(result.cashVes)} Bs
              </Text>
            </View>
            {applyIgtf && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-text-secondary">
                  + IGTF ({fiscalSettings.igtfPercent}% sobre efectivo):
                </Text>
                <Text
                  className="text-xs font-semibold text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  +{formatNumber(result.igtfVes)} Bs
                </Text>
              </View>
            )}
            <View
              className="mt-1 flex-row justify-between border-t pt-2"
              style={{ borderColor: COLORS.border }}
            >
              <Text className="text-sm font-semibold text-text-primary">
                {result.changeVes > 0 ? 'Vuelto:' : 'Restante en Bs:'}
              </Text>
              <Text
                className="text-sm font-bold"
                style={{
                  color: result.changeVes > 0 ? COLORS.success : COLORS.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatNumber(
                  result.changeVes > 0 ? result.changeVes : result.remainingVes,
                )}{' '}
                Bs
              </Text>
            </View>

            {result.remainingVes > 0 && (
              <View className="mt-3 flex-row gap-2.5">
                <Pressable
                  onPress={() => {
                    triggerSelectionHaptic();
                    void copyToClipboard(
                      formatBankAmount(result.remainingVes),
                      `Copiado: ${formatBankAmount(result.remainingVes)} Bs`,
                    );
                  }}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated py-2.5 active:opacity-80"
                >
                  <Copy size={14} color={COLORS.textPrimary} />
                  <Text className="text-xs font-medium text-text-primary">
                    Copiar monto
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerSelectionHaptic();
                    router.push({
                      pathname: '/tools/payments',
                      params: {
                        amount: result.remainingVes.toFixed(2),
                        currency: 'VES',
                      },
                    });
                  }}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 active:opacity-85"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <CreditCard size={14} color="#ffffff" />
                  <Text className="text-xs font-medium text-white">
                    Enviar c/plantilla
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
