import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { AppModal } from '@/components/ui/AppModal';
import { AppSheet } from '@/components/ui/AppSheet';
import { Card } from '@/components/ui/Card';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useEffectiveRates } from '@/hooks/useEffectiveRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBillSplitStore } from '@/store/billSplitStore';
import type { BillSplit, CurrencyCode } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import {
  formatFullDateTime,
  formatNumber,
  parseFormattedNumber,
} from '@/utils/formatters';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import { sanitizeDecimalInput } from '@/utils/shoppingUtils';
import { computeSplitSummary } from '@/utils/splitUtils';

export default function BillSplitsScreen() {
  const router = useRouter();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { snapshot } = useEffectiveRates();
  const { splits, createSplit, deleteSplit } = useBillSplitStore();

  const [createVisible, setCreateVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [totalText, setTotalText] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [peopleCount, setPeopleCount] = useState(2);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BillSplit | null>(null);

  const openCreateSheet = () => {
    triggerSelectionHaptic();
    setFormError(null);
    setTitle('');
    setTotalText('');
    setCurrency('USD');
    setPeopleCount(2);
    setCreateVisible(true);
  };

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Escribe un nombre para identificar esta cuenta.');
      return;
    }
    const total = totalText ? parseFormattedNumber(totalText) : 0;
    if (total <= 0) {
      setFormError('Ingresa un total de factura mayor a 0.');
      return;
    }

    triggerImpactHaptic('light');
    const newId = createSplit({
      title: trimmedTitle,
      total,
      currency,
      peopleCount,
      ratesSnapshot: snapshot,
    });
    setCreateVisible(false);
    router.push({ pathname: '/tools/split/[id]', params: { id: newId } });
  };

  return (
    <View
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      <ScreenHero
        title="Divisor de cuentas"
        subtitle="Divide entre amigos con propina y control de pagos"
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
        rightElement={
          <Pressable
            onPress={openCreateSheet}
            className="flex-row items-center gap-1 rounded-xl bg-white px-3 py-2 active:opacity-85"
            style={{ borderCurve: 'continuous' }}
          >
            <Plus size={15} color={COLORS.primary} strokeWidth={2.5} />
            <Text
              className="text-xs font-medium"
              style={{ color: COLORS.primary }}
            >
              Nueva
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          gap: 12,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        {splits.length === 0 ? (
          <Card className="items-center py-10">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${COLORS.primary}1A`,
                borderCurve: 'continuous',
              }}
            >
              <Users size={30} color={COLORS.primary} />
            </View>
            <Text className="text-center text-base font-semibold text-text-primary">
              Sin cuentas divididas aún
            </Text>
            <Text className="mt-1.5 max-w-[275px] text-center text-xs leading-5 text-text-secondary">
              Ingresa una factura en USD, USDT, EUR o Bs, agrega propina y marca quién ya pagó con su equivalente exacto.
            </Text>
            <Pressable
              onPress={openCreateSheet}
              className="mt-5 flex-row items-center gap-2 rounded-2xl px-6 py-3 active:opacity-85"
              style={{
                backgroundColor: COLORS.primary,
                borderCurve: 'continuous',
              }}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-sm font-medium text-white">
                Dividir primera cuenta
              </Text>
            </Pressable>
          </Card>
        ) : (
          splits.map((split, idx) => {
            const summary = computeSplitSummary(split);
            const allPaid =
              summary.paidCount === summary.totalCount && summary.totalCount > 0;
            return (
              <Animated.View
                key={split.id}
                entering={FadeInDown.delay(idx * 45).duration(280)}
              >
                <Pressable
                  onPress={() => {
                    triggerSelectionHaptic();
                    router.push({
                      pathname: '/tools/split/[id]',
                      params: { id: split.id },
                    });
                  }}
                  className="active:opacity-85"
                >
                  <Card
                    className="border"
                    style={{
                      borderColor: allPaid ? COLORS.success : COLORS.border,
                    }}
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text
                            className="text-base font-semibold text-text-primary"
                            numberOfLines={1}
                          >
                            {split.title}
                          </Text>
                          <View
                            className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: allPaid
                                ? `${COLORS.success}1A`
                                : `${COLORS.primary}1A`,
                            }}
                          >
                            {allPaid && (
                              <CheckCircle2 size={11} color={COLORS.success} />
                            )}
                            <Text
                              className="text-[10px] font-semibold"
                              style={{
                                color: allPaid ? COLORS.success : COLORS.primary,
                              }}
                            >
                              {summary.paidCount}/{summary.totalCount} pagaron
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-0.5 text-xs text-text-muted">
                          {formatFullDateTime(split.createdAt)}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          triggerSelectionHaptic();
                          setDeleteTarget(split);
                        }}
                        hitSlop={8}
                        className="rounded-lg bg-danger/10 p-1.5 active:opacity-75"
                      >
                        <Trash2 size={14} color={COLORS.danger} />
                      </Pressable>
                    </View>

                    <View className="mt-3 flex-row items-baseline justify-between rounded-xl bg-surface-elevated px-3 py-2.5">
                      <View>
                        <Text className="text-[10px] text-text-muted">
                          Total con propina
                        </Text>
                        <Text
                          className="text-base font-bold text-text-primary"
                          style={{ fontVariant: ['tabular-nums'] }}
                        >
                          {CURRENCY_SYMBOLS[split.currency]}{' '}
                          {formatNumber(summary.grandTotal)}
                        </Text>
                      </View>

                      {split.currency !== 'VES' && (
                        <Text
                          className="text-xs font-semibold text-text-secondary"
                          style={{ fontVariant: ['tabular-nums'] }}
                        >
                          {formatNumber(summary.grandEquivalents.VES)} Bs
                        </Text>
                      )}
                    </View>

                    <View className="mt-2.5 flex-row items-center justify-end gap-1">
                      <Text
                        className="text-xs font-medium"
                        style={{ color: COLORS.primary }}
                      >
                        Ver personas y cuotas
                      </Text>
                      <ArrowRight size={13} color={COLORS.primary} />
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <AppSheet
        visible={createVisible}
        title="Nueva cuenta dividida"
        subtitle="Ingresa el monto inicial y cuántas personas participan"
        onClose={() => setCreateVisible(false)}
        footer={
          <Pressable
            onPress={handleCreate}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
            style={{
              backgroundColor: COLORS.primary,
              borderCurve: 'continuous',
            }}
          >
            <Check size={17} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-sm font-medium text-white">Crear cuenta</Text>
          </Pressable>
        }
      >
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Nombre de la cuenta o salida *
            </Text>
            <TextInput
              value={title}
              onChangeText={(txt) => {
                if (formError) setFormError(null);
                setTitle(txt);
              }}
              placeholder="Ej. Cena del viernes, Pizzas, Almuerzo"
              placeholderTextColor={COLORS.textMuted}
              maxLength={40}
              className="rounded-xl border border-border bg-surface-elevated px-3.5"
              style={singleLineInputStyle({ color: COLORS.textPrimary })}
            />
          </View>

          <View className="gap-2">
            <Text className="text-xs font-semibold text-text-secondary">
              Total de la factura *
            </Text>
            <View className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
              <Text
                className="text-lg font-bold"
                style={{ color: COLORS.primary }}
              >
                {CURRENCY_SYMBOLS[currency]}
              </Text>
              <TextInput
                value={totalText}
                onChangeText={(txt) => {
                  if (formError) setFormError(null);
                  setTotalText(sanitizeDecimalInput(txt, totalText));
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                className="flex-1"
                style={singleLineInputStyle({
                  color: COLORS.textPrimary,
                  fontSize: 18,
                  height: 48,
                  weight: 'bold',
                  tabularNums: true,
                })}
              />
              <ClearInputButton
                visible={totalText.length > 0}
                onPress={() => {
                  if (formError) setFormError(null);
                  setTotalText('');
                }}
              />
            </View>
            <CurrencyChipRow selected={currency} onSelect={setCurrency} />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-text-secondary">
              Número de personas
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => {
                  triggerSelectionHaptic();
                  setPeopleCount((prev) => Math.max(1, prev - 1));
                }}
                className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated active:opacity-75"
              >
                <Text className="text-base font-medium text-text-primary">-</Text>
              </Pressable>
              <Text className="min-w-[24px] text-center text-base font-semibold text-text-primary">
                {peopleCount}
              </Text>
              <Pressable
                onPress={() => {
                  triggerSelectionHaptic();
                  setPeopleCount((prev) => Math.min(30, prev + 1));
                }}
                className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated active:opacity-75"
              >
                <Text
                  className="text-base font-medium"
                  style={{ color: COLORS.primary }}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          {formError ? (
            <Text className="text-xs font-medium text-danger">{formError}</Text>
          ) : null}
        </View>
      </AppSheet>

      <AppModal
        visible={deleteTarget !== null}
        title="Eliminar cuenta"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.title ?? ''}"?`}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (deleteTarget) {
            deleteSplit(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}
