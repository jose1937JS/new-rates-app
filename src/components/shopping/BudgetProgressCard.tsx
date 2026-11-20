import { Pencil, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode } from '@/types/currency.types';
import { parseFormattedNumber } from '@/utils/formatters';
import { triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import {
  formatShoppingMoney,
  sanitizeDecimalInput,
  type BudgetEvaluation,
} from '@/utils/shoppingUtils';

interface BudgetProgressBarProps {
  budget: BudgetEvaluation;
  displayCurrency: CurrencyCode;
  editable?: boolean;
  onEditPress?: () => void;
}

export function BudgetProgressBar({
  budget,
  displayCurrency,
  editable = true,
  onEditPress,
}: BudgetProgressBarProps) {
  const COLORS = useThemeColors();

  if (!budget.hasBudget) {
    if (!editable || !onEditPress) return null;
    return (
      <Pressable
        onPress={onEditPress}
        className="mt-3 flex-row items-center justify-between rounded-xl px-3 py-2 active:opacity-80"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          borderCurve: 'continuous',
        }}
      >
        <View className="flex-row items-center gap-2">
          <Wallet size={14} color="#ffffff" />
          <Text className="text-xs font-medium text-white">
            Definir monto límite de compra
          </Text>
        </View>
        <Text className="text-xs font-medium text-white">+ Límite</Text>
      </Pressable>
    );
  }

  const barWidth = Math.min(100, Math.max(3, budget.percentageUsed));
  const statusBg =
    budget.status === 'exceeded'
      ? '#fee2e2'
      : budget.status === 'warning'
        ? '#fef3c7'
        : '#dcfce7';
  const statusText =
    budget.status === 'exceeded'
      ? '#b91c1c'
      : budget.status === 'warning'
        ? '#b45309'
        : '#15803d';
  const barFill =
    budget.status === 'exceeded'
      ? COLORS.danger
      : budget.status === 'warning'
        ? '#f59e0b'
        : '#22c55e';

  return (
    <View
      className="mt-3 rounded-xl p-2.5"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
        borderCurve: 'continuous',
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5">
          <Wallet size={13} color="#ffffff" />
          <Text
            className="text-sm font-medium text-white/90"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            Límite:{' '}
            {formatShoppingMoney(budget.limitInDisplay, displayCurrency)}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: statusBg }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: statusText, fontVariant: ['tabular-nums'] }}
            >
              {Math.round(budget.percentageUsed)}%
            </Text>
          </View>
          {editable && onEditPress ? (
            <Pressable
              onPress={onEditPress}
              hitSlop={8}
              className="rounded-full p-1 active:opacity-70"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
            >
              <Pencil size={11} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        className="mt-2 h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)' }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${barWidth}%`, backgroundColor: barFill }}
        />
      </View>

      <Text
        className="mt-2 text-sm font-medium text-white"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {budget.status === 'exceeded'
          ? `Te pasaste por ${formatShoppingMoney(
              Math.abs(budget.remainingInDisplay),
              displayCurrency,
            )}`
          : `Te queda disponible: ${formatShoppingMoney(
              budget.remainingInDisplay,
              displayCurrency,
            )}`}
      </Text>
    </View>
  );
}

interface ListSettingsModalProps {
  visible: boolean;
  initialTitle: string;
  initialBudgetLimit?: number;
  initialBudgetCurrency: CurrencyCode;
  confirmLabel?: string;
  onSave: (payload: {
    title: string;
    budgetLimit: number | null;
    budgetCurrency: CurrencyCode;
  }) => void;
  onClose: () => void;
}

export function ListSettingsModal({
  visible,
  initialTitle,
  initialBudgetLimit,
  initialBudgetCurrency,
  confirmLabel = 'Guardar',
  onSave,
  onClose,
}: ListSettingsModalProps) {
  const COLORS = useThemeColors();
  const [title, setTitle] = useState(initialTitle);
  const [budgetText, setBudgetText] = useState(
    initialBudgetLimit ? String(initialBudgetLimit) : '',
  );
  const [budgetCurrency, setBudgetCurrency] = useState<CurrencyCode>(
    initialBudgetCurrency,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setErrorMsg(null);
      setTitle(initialTitle);
      setBudgetText(initialBudgetLimit ? String(initialBudgetLimit) : '');
      setBudgetCurrency(initialBudgetCurrency);
    }
  }, [visible, initialTitle, initialBudgetLimit, initialBudgetCurrency]);

  const handleSave = () => {
    const trimmedBudget = budgetText.trim();
    const parsedLimit = trimmedBudget ? parseFormattedNumber(trimmedBudget) : 0;
    if (trimmedBudget.length > 0 && parsedLimit <= 0) {
      setErrorMsg('El monto límite debe ser mayor a 0 o déjalo vacío.');
      return;
    }

    triggerSelectionHaptic();
    onSave({
      title: title.trim(),
      budgetLimit: parsedLimit > 0 ? parsedLimit : null,
      budgetCurrency,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <Animated.View
          entering={ZoomIn.duration(180)}
          className="w-full max-w-[360px] rounded-3xl border bg-surface-card p-5"
          style={{
            borderColor: COLORS.border,
            borderCurve: 'continuous',
          }}
        >
          <Text className="text-base font-semibold text-text-primary">
            Configurar lista
          </Text>
          <Text className="mt-0.5 text-xs text-text-secondary">
            Define un nombre y un monto límite opcional para no pasarte en caja.
          </Text>

          <View className="mt-4 gap-3">
            <View className="gap-1.5">
              <Text className="text-xs font-medium text-text-secondary">
                Nombre de la compra (opcional)
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Mercado, Farmacia..."
                placeholderTextColor={COLORS.textMuted}
                className="rounded-xl border bg-surface-elevated px-3.5"
                style={[
                  { borderColor: COLORS.border },
                  singleLineInputStyle({ color: COLORS.textPrimary }),
                ]}
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-medium text-text-secondary">
                Monto límite (opcional)
              </Text>
              <View
                className="h-11 flex-row items-center gap-2 rounded-xl border bg-surface-elevated px-3.5"
                style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
              >
                <TextInput
                  value={budgetText}
                  onChangeText={(t) => {
                    if (errorMsg) setErrorMsg(null);
                    setBudgetText(sanitizeDecimalInput(t, budgetText));
                  }}
                  placeholder="Sin límite"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  className="flex-1"
                  style={singleLineInputStyle({
                    color: COLORS.textPrimary,
                    weight: 'semibold',
                    tabularNums: true,
                  })}
                />
                <ClearInputButton
                  visible={budgetText.length > 0}
                  onPress={() => {
                    if (errorMsg) setErrorMsg(null);
                    setBudgetText('');
                  }}
                />
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-medium text-text-secondary">
                Moneda del límite
              </Text>
              <CurrencyChipRow
                selected={budgetCurrency}
                onSelect={setBudgetCurrency}
              />
            </View>

            {errorMsg ? (
              <Text className="text-xs font-medium text-danger">{errorMsg}</Text>
            ) : null}
          </View>

          <View className="mt-5 flex-row gap-2.5">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl bg-surface-elevated py-3 active:opacity-80"
              style={{ borderCurve: 'continuous' }}
            >
              <Text className="text-sm font-medium text-text-secondary">
                Cancelar
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              className="flex-1 items-center justify-center rounded-xl py-3 active:opacity-85"
              style={{
                backgroundColor: COLORS.primary,
                borderCurve: 'continuous',
              }}
            >
              <Text className="text-sm font-medium text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
