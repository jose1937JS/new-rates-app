import { Check, Receipt, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { Card } from '@/components/ui/Card';
import type { ConversionMap } from '@/hooks/useConversion';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode, ShoppingRatesSnapshot } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { formatPercentage, parseFormattedNumber } from '@/utils/formatters';
import {
  triggerNotificationHaptic,
  triggerSelectionHaptic,
} from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import {
  compareActualPaid,
  formatShoppingMoney,
  sanitizeDecimalInput,
} from '@/utils/shoppingUtils';

interface ActualPaidCardProps {
  totals: ConversionMap;
  displayCurrency: CurrencyCode;
  actualPaidAmount?: number;
  actualPaidCurrency: CurrencyCode;
  ratesSnapshot: ShoppingRatesSnapshot;
  readOnly?: boolean;
  onSaveActualPaid: (amount: number | undefined, currency: CurrencyCode) => void;
}

export function ActualPaidCard({
  totals,
  displayCurrency,
  actualPaidAmount,
  actualPaidCurrency,
  ratesSnapshot,
  readOnly = false,
  onSaveActualPaid,
}: ActualPaidCardProps) {
  const COLORS = useThemeColors();
  const [amountText, setAmountText] = useState(
    actualPaidAmount ? String(actualPaidAmount) : '',
  );
  const [currency, setCurrency] = useState<CurrencyCode>(actualPaidCurrency);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setErrorMsg(null);
    setAmountText(actualPaidAmount ? String(actualPaidAmount) : '');
    setCurrency(actualPaidCurrency);
  }, [actualPaidAmount, actualPaidCurrency]);

  const parsedInput = amountText ? parseFormattedNumber(amountText) : 0;

  const comparison = compareActualPaid(
    totals,
    actualPaidAmount,
    actualPaidCurrency,
    displayCurrency,
    ratesSnapshot,
  );

  const handleSave = () => {
    if (readOnly) return;
    if (amountText.trim().length > 0 && parsedInput <= 0) {
      setErrorMsg('Ingresa un monto cobrado mayor a 0 o limpia el campo.');
      return;
    }
    setErrorMsg(null);
    triggerNotificationHaptic('success');
    onSaveActualPaid(parsedInput > 0 ? parsedInput : undefined, currency);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleClear = () => {
    if (readOnly) return;
    setErrorMsg(null);
    triggerSelectionHaptic();
    setAmountText('');
    onSaveActualPaid(undefined, currency);
  };

  const diffColor =
    comparison.state === 'over'
      ? COLORS.danger
      : comparison.state === 'under'
        ? COLORS.success
        : COLORS.success;

  if (readOnly && !comparison.hasActualPaid) {
    return null;
  }

  const comparisonSummary = comparison.hasActualPaid ? (
    <View
      className={`${readOnly ? 'mt-2' : 'mt-3'} rounded-xl border p-3`}
      style={{
        backgroundColor: `${diffColor}12`,
        borderColor: `${diffColor}35`,
        borderCurve: 'continuous',
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-text-secondary">Total calculado</Text>
        <Text
          className="text-sm font-semibold text-text-primary"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatShoppingMoney(
            comparison.calculatedInDisplay,
            displayCurrency,
          )}
        </Text>
      </View>

      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-xs text-text-secondary">Real cobrado</Text>
        <Text
          className="text-sm font-semibold text-text-primary"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatShoppingMoney(comparison.actualInDisplay, displayCurrency)}
        </Text>
      </View>

      <View className="mt-2 flex-row items-center justify-between border-t border-border/40 pt-2">
        <Text
          className="text-xs font-medium"
          style={{ color: diffColor }}
        >
          {comparison.state === 'exact'
            ? 'Monto exacto'
            : comparison.state === 'over'
              ? 'Diferencia pagada de más'
              : 'Ahorro frente al cálculo'}
        </Text>
        <Text
          className="text-sm font-semibold"
          style={{ color: diffColor, fontVariant: ['tabular-nums'] }}
        >
          {comparison.state === 'exact'
            ? '0,00'
            : `${comparison.diffInDisplay > 0 ? '+' : '-'}${formatShoppingMoney(
                Math.abs(comparison.diffInDisplay),
                displayCurrency,
              )} (${formatPercentage(comparison.diffPercent)})`}
        </Text>
      </View>
    </View>
  ) : null;

  if (readOnly) {
    return (
      <Card
        title="Precio real cobrado"
        icon={<Receipt size={16} color={COLORS.primary} />}
      >
        {comparisonSummary}
      </Card>
    );
  }

  return (
    <Card
      title="Precio real cobrado"
      icon={<Receipt size={16} color={COLORS.primary} />}
      headerRight={
        savedNotice ? (
          <View className="flex-row items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5">
            <Check size={12} color={COLORS.success} />
            <Text className="text-[11px] font-semibold text-success">
              Guardado
            </Text>
          </View>
        ) : null
      }
    >
      <Text className="my-3 text-xs text-text-secondary">
        Anota cuánto te cobraron realmente en caja para compararlo con tu cuenta.
      </Text>

      <View
        className="h-12 flex-row items-center gap-2 rounded-xl border bg-surface-elevated px-3"
        style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
      >
        <Text
          className="text-base font-bold"
          style={{ color: COLORS.primary }}
        >
          {CURRENCY_SYMBOLS[currency]}
        </Text>
        <TextInput
          value={amountText}
          onChangeText={(t) => {
            if (errorMsg) setErrorMsg(null);
            setAmountText(sanitizeDecimalInput(t, amountText));
          }}
          placeholder="Monto cobrado en caja"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          className="flex-1"
          style={singleLineInputStyle({
            color: COLORS.textPrimary,
            fontSize: 15,
            height: 48,
            weight: 'semibold',
            tabularNums: true,
          })}
        />
        {amountText.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <X size={15} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {errorMsg ? (
        <Text className="mt-1.5 text-xs font-medium text-danger">{errorMsg}</Text>
      ) : null}

      <View className="mt-2.5">
        <CurrencyChipRow selected={currency} onSelect={setCurrency} />
      </View>

      <Pressable
        onPress={handleSave}
        className="mt-3 flex-row items-center justify-center gap-1.5 rounded-xl py-3 active:opacity-85"
        style={{
          backgroundColor: COLORS.primary,
          borderCurve: 'continuous',
        }}
      >
        <Check size={16} color="#ffffff" strokeWidth={2.4} />
        <Text className="text-xs font-medium text-white">
          {actualPaidAmount ? 'Actualizar monto real' : 'Guardar monto real'}
        </Text>
      </Pressable>

      {/* Comparison summary when saved */}
      {comparisonSummary}
    </Card>
  );
}
