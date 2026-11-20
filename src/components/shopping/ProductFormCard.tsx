import { Check, Minus, Plus, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import type {
  CurrencyCode,
  ShoppingItem,
  ShoppingRatesSnapshot,
} from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { parseFormattedNumber } from '@/utils/formatters';
import {
  triggerImpactHaptic,
  triggerSelectionHaptic,
} from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import {
  formatShoppingMoney,
  getItemSubtotal,
  sanitizeDecimalInput,
} from '@/utils/shoppingUtils';

interface ProductFormCardProps {
  defaultCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  ratesSnapshot: ShoppingRatesSnapshot;
  editingItem: ShoppingItem | null;
  onSubmit: (payload: {
    name: string;
    unitPrice: number;
    currency: CurrencyCode;
    quantity: number;
  }) => void;
  onCancelEdit?: () => void;
}

export function ProductFormCard({
  defaultCurrency,
  displayCurrency,
  ratesSnapshot,
  editingItem,
  onSubmit,
  onCancelEdit,
}: ProductFormCardProps) {
  const COLORS = useThemeColors();
  const priceInputRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [priceText, setPriceText] = useState('');
  const [qtyText, setQtyText] = useState('1');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPriceText(String(editingItem.unitPrice));
      setQtyText(String(editingItem.quantity));
      setCurrency(editingItem.currency);
    } else {
      setName('');
      setPriceText('');
      setQtyText('1');
      setCurrency(defaultCurrency);
    }
  }, [editingItem, defaultCurrency]);

  const numericPrice = priceText ? parseFormattedNumber(priceText) : 0;
  const numericQty = qtyText ? parseFormattedNumber(qtyText) : 0;
  const isValid = numericPrice > 0 && numericQty > 0;

  const previewNative = numericPrice * (numericQty > 0 ? numericQty : 1);
  const previewConverted = getItemSubtotal(
    {
      unitPrice: numericPrice,
      quantity: numericQty > 0 ? numericQty : 1,
      currency,
    },
    displayCurrency,
    ratesSnapshot,
  );

  const stepQuantity = (delta: number) => {
    triggerSelectionHaptic();
    const current = qtyText ? parseFormattedNumber(qtyText) : 1;
    const next = Math.max(1, Math.round((current + delta) * 100) / 100);
    setQtyText(String(next));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    triggerImpactHaptic('light');
    onSubmit({
      name: name.trim(),
      unitPrice: numericPrice,
      currency,
      quantity: numericQty,
    });

    if (!editingItem) {
      setName('');
      setPriceText('');
      setQtyText('1');
      priceInputRef.current?.focus();
    }
  };

  return (
    <Card
      className="border"
      style={{
        borderColor: editingItem ? COLORS.primary : COLORS.border,
      }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-text-primary">
          {editingItem ? 'Editando producto' : 'Agregar producto'}
        </Text>
        {editingItem && onCancelEdit ? (
          <Pressable
            onPress={onCancelEdit}
            className="flex-row items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-1 active:opacity-75"
          >
            <X size={12} color={COLORS.textSecondary} />
            <Text className="text-[11px] font-medium text-text-secondary">
              Cancelar
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Price + Quantity Stepper row */}
      <View className="flex-row gap-2.5">
        {/* Unit price input */}
        <View className="flex-1 gap-1">
          <Text className="text-[11px] font-medium text-text-secondary">
            Precio ({currency})
          </Text>
          <View
            className="h-12 flex-row items-center gap-1.5 rounded-xl border bg-surface-elevated px-3"
            style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
          >
            <Text
              className="text-base font-bold"
              style={{ color: COLORS.primary }}
            >
              {CURRENCY_SYMBOLS[currency]}
            </Text>
            <TextInput
              ref={priceInputRef}
              value={priceText}
              onChangeText={(t) =>
                setPriceText(sanitizeDecimalInput(t, priceText))
              }
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              className="flex-1"
              style={singleLineInputStyle({
                color: COLORS.textPrimary,
                fontSize: 18,
                height: 48,
                weight: 'bold',
                tabularNums: true,
              })}
            />
            {priceText.length > 0 && (
              <Pressable
                onPress={() => setPriceText('')}
                hitSlop={6}
                className="rounded-full p-1 active:opacity-70"
              >
                <X size={14} color={COLORS.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Quantity stepper */}
        <View className="w-[132px] gap-1">
          <Text className="text-[11px] font-medium text-text-secondary">
            Cantidad
          </Text>
          <View
            className="h-12 flex-row items-center justify-between rounded-xl border bg-surface-elevated px-1.5"
            style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
          >
            <Pressable
              onPress={() => stepQuantity(-1)}
              className="h-9 w-9 items-center justify-center rounded-lg bg-surface-card active:opacity-75"
              style={{ borderCurve: 'continuous' }}
            >
              <Minus size={14} color={COLORS.textPrimary} />
            </Pressable>
            <TextInput
              value={qtyText}
              onChangeText={(t) => setQtyText(sanitizeDecimalInput(t, qtyText))}
              keyboardType="decimal-pad"
              textAlign="center"
              className="w-10 text-center"
              style={singleLineInputStyle({
                color: COLORS.textPrimary,
                fontSize: 14,
                height: 48,
                weight: 'bold',
                tabularNums: true,
              })}
            />
            <Pressable
              onPress={() => stepQuantity(1)}
              className="h-9 w-9 items-center justify-center rounded-lg bg-surface-card active:opacity-75"
              style={{ borderCurve: 'continuous' }}
            >
              <Plus size={14} color={COLORS.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Currency selector for item price */}
      <View className="mt-2.5">
        <CurrencyChipRow selected={currency} onSelect={setCurrency} />
      </View>

      {/* Optional product name */}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del producto (opcional, ej. Harina PAN)"
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        className="mt-2.5 rounded-xl border bg-surface-elevated px-3"
        style={[
          { borderColor: COLORS.border, borderCurve: 'continuous' },
          singleLineInputStyle({ color: COLORS.textPrimary }),
        ]}
      />

      {(priceText.length > 0 && numericPrice <= 0) ||
      (qtyText.length > 0 && numericQty <= 0) ? (
        <Text className="mt-2 text-xs font-medium text-danger">
          El precio y la cantidad deben ser mayores a 0.
        </Text>
      ) : null}

      {/* Live subtotal preview & Submit button */}
      <View className="mt-3 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[11px] text-text-muted">Subtotal</Text>
          <Text
            className="text-sm font-bold text-text-primary"
            style={{ fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
          >
            {numericPrice > 0
              ? currency === displayCurrency
                ? formatShoppingMoney(previewNative, currency)
                : `${formatShoppingMoney(
                    previewNative,
                    currency,
                  )} ≈ ${formatShoppingMoney(previewConverted, displayCurrency)}`
              : '--'}
          </Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid}
          className="flex-row items-center justify-center gap-1.5 rounded-xl px-4 py-3 active:opacity-85"
          style={{
            backgroundColor: isValid ? COLORS.primary : COLORS.surfaceElevated,
            borderCurve: 'continuous',
          }}
        >
          {editingItem ? (
            <Check
              size={16}
              color={isValid ? '#ffffff' : COLORS.textMuted}
              strokeWidth={2.5}
            />
          ) : (
            <Plus
              size={16}
              color={isValid ? '#ffffff' : COLORS.textMuted}
              strokeWidth={2.5}
            />
          )}
          <Text
            className="text-xs font-medium"
            style={{ color: isValid ? '#ffffff' : COLORS.textMuted }}
          >
            {editingItem ? 'Guardar' : 'Agregar'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
