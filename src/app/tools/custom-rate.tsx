import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Pencil,
  Plus,
  SlidersHorizontal,
  Store,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppModal } from '@/components/ui/AppModal';
import { AppSheet } from '@/components/ui/AppSheet';
import { Card } from '@/components/ui/Card';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SelectableChip } from '@/components/ui/SelectableChip';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useTabTransition } from '@/hooks/useTabTransition';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCustomRateStore } from '@/store/customRateStore';
import type {
  CustomRateBase,
  CustomRateItem,
  CustomRateMode,
  CustomRateRounding,
} from '@/types/currency.types';
import {
  CUSTOM_RATE_EMOJI_PRESETS,
  CUSTOM_RATE_ROUNDING_OPTIONS,
  resolveCustomRateValue,
} from '@/utils/customRateUtils';
import { formatNumber, parseFormattedNumber } from '@/utils/formatters';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import { sanitizeDecimalInput } from '@/utils/shoppingUtils';

function sanitizeSignedDecimal(next: string, previous: string): string {
  const normalized = next.replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  if (!normalized || normalized === '-') return normalized;
  const negative = normalized.startsWith('-');
  const unsigned = normalized.replace(/-/g, '');
  const parts = unsigned.split('.');
  if (parts.length > 2) return previous;
  const intPart = parts[0] ?? '';
  const decPart = parts[1];
  const combined =
    decPart !== undefined ? `${intPart}.${decPart.slice(0, 2)}` : intPart;
  return negative ? `-${combined}` : combined;
}

const MODE_OPTIONS: Array<{ id: CustomRateMode; label: string }> = [
  { id: 'average', label: 'Promedio' },
  { id: 'margin', label: 'Margen %' },
  { id: 'fixed', label: 'Fija' },
];

const BASE_OPTIONS: Array<{ id: CustomRateBase; label: string }> = [
  { id: 'BCV_USD', label: 'BCV $' },
  { id: 'BCV_EUR', label: 'BCV €' },
  { id: 'USDT', label: 'USDT' },
];

const MARGIN_PRESETS = [-5, -2, 0, 2, 5, 10] as const;

export default function CustomRatesScreen() {
  const router = useRouter();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { rates } = useCurrencyRates();

  const {
    customRates,
    addCustomRate,
    updateCustomRate,
    toggleCustomRate,
    deleteCustomRate,
  } = useCustomRateStore();

  const { triggerTransition, transitionStyle } = useTabTransition();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomRateItem | null>(null);

  const [emoji, setEmoji] = useState('🏪');
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<CustomRateMode>('average');
  const [fixedText, setFixedText] = useState('');
  const [base, setBase] = useState<CustomRateBase>('BCV_USD');
  const [marginText, setMarginText] = useState('3');
  const [rounding, setRounding] = useState<CustomRateRounding>(0);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateSheet = () => {
    triggerSelectionHaptic();
    setFormError(null);
    setEditingItem(null);
    setEmoji('🏪');
    setLabel('');
    setMode('average');
    setFixedText(rates?.usd.rateToVes ? rates.usd.rateToVes.toFixed(2) : '');
    setBase('BCV_USD');
    setMarginText('3');
    setRounding(0);
    setSheetVisible(true);
  };

  const openEditSheet = (item: CustomRateItem) => {
    triggerSelectionHaptic();
    setFormError(null);
    setEditingItem(item);
    setEmoji(item.emoji);
    setLabel(item.label);
    setMode(item.mode);
    setFixedText(item.fixedRate ? String(item.fixedRate) : '');
    setBase(item.base);
    setMarginText(String(item.marginPercent));
    setRounding(item.rounding);
    setSheetVisible(true);
  };

  const parsedFixed = fixedText ? parseFormattedNumber(fixedText) : 0;
  const hasNumericMargin =
    marginText.trim().length > 0 && marginText.trim() !== '-';
  const parsedMargin = hasNumericMargin
    ? Number.parseFloat(marginText.replace(',', '.'))
    : Number.NaN;

  const draftPreviewRate = resolveCustomRateValue(
    {
      id: 'preview',
      emoji: emoji.trim() || '🏪',
      label: label.trim() || 'Tasa Comercio',
      enabled: true,
      mode,
      fixedRate: parsedFixed,
      base,
      marginPercent: Number.isFinite(parsedMargin) ? parsedMargin : 0,
      rounding,
      createdAt: '',
      updatedAt: '',
    },
    rates,
  );

  const handleSave = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setFormError('Escribe un nombre para identificar esta tasa.');
      return;
    }
    if (mode === 'fixed' && parsedFixed <= 0) {
      setFormError('Ingresa un valor fijo mayor a 0 Bs.');
      return;
    }
    if (
      mode === 'margin' &&
      (!Number.isFinite(parsedMargin) ||
        parsedMargin <= -100 ||
        parsedMargin > 500)
    ) {
      setFormError('Ingresa un ajuste porcentual válido (entre -99% y 500%).');
      return;
    }

    triggerImpactHaptic('light');
    const payload = {
      emoji: emoji.trim() || '🏪',
      label: trimmedLabel,
      mode,
      fixedRate: mode === 'fixed' ? parsedFixed : undefined,
      base,
      marginPercent: mode === 'margin' ? parsedMargin : 0,
      rounding,
    };

    if (editingItem) {
      updateCustomRate(editingItem.id, payload);
    } else {
      addCustomRate(payload);
    }
    setSheetVisible(false);
  };

  return (
    <View
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      <ScreenHero
        title="Tasas personalizadas"
        subtitle="Múltiples tasas locales sin alterar BCV ni Yadio"
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
        {customRates.length === 0 ? (
          <Card className="items-center py-10">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${COLORS.primary}1A`,
                borderCurve: 'continuous',
              }}
            >
              <Store size={30} color={COLORS.primary} />
            </View>
            <Text className="text-center text-base font-semibold text-text-primary">
              Aún no tienes tasas personalizadas
            </Text>
            <Text className="mt-1.5 max-w-[280px] text-center text-xs leading-5 text-text-secondary">
              Crea una o varias tasas para comercios, punto de venta, promedio o redondeos propios, con su emoji y etiqueta.
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
                Crear mi primera tasa
              </Text>
            </Pressable>
          </Card>
        ) : (
          customRates.map((item, idx) => {
            const resolved = resolveCustomRateValue(item, rates);
            const modeDesc =
              item.mode === 'fixed'
                ? 'Valor fijo manual'
                : item.mode === 'average'
                  ? 'Promedio (BCV $ + USDT) / 2'
                  : `${item.base === 'BCV_USD' ? 'BCV $' : item.base === 'BCV_EUR' ? 'BCV €' : 'USDT'} ${item.marginPercent >= 0 ? '+' : ''}${item.marginPercent}%`;

            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(idx * 45).duration(280)}
              >
                <Card
                  className="border"
                  style={{
                    borderColor: item.enabled ? COLORS.primary : COLORS.border,
                    opacity: item.enabled ? 1 : 0.78,
                  }}
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1 flex-row items-center gap-3">
                      <View
                        className="h-11 w-11 items-center justify-center rounded-2xl"
                        style={{
                          backgroundColor: COLORS.surfaceElevated,
                          borderCurve: 'continuous',
                        }}
                      >
                        <Text className="text-2xl">{item.emoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-base font-semibold text-text-primary"
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        <Text className="text-xs text-text-secondary">
                          {modeDesc}
                          {item.rounding > 0
                            ? ` • Redondeo ${item.rounding} Bs`
                            : ''}
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={item.enabled}
                      onValueChange={() => {
                        triggerSelectionHaptic();
                        toggleCustomRate(item.id);
                      }}
                      trackColor={{
                        false: COLORS.border,
                        true: `${COLORS.primary}80`,
                      }}
                      thumbColor={item.enabled ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>

                  <View className="mt-3 flex-row items-center justify-between rounded-xl bg-surface-elevated px-3 py-2.5">
                    <View>
                      <Text className="text-[10px] text-text-muted">
                        Tasa resultante
                      </Text>
                      <Text
                        className="text-lg font-bold text-text-primary"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {resolved > 0
                          ? `1 $ = ${formatNumber(resolved, 2)} Bs`
                          : '--'}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => openEditSheet(item)}
                        hitSlop={6}
                        className="flex-row items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1.5 active:opacity-75"
                      >
                        <Pencil size={12} color={COLORS.textSecondary} />
                        <Text className="text-xs font-medium text-text-secondary">
                          Editar
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          triggerSelectionHaptic();
                          setDeleteTarget(item);
                        }}
                        hitSlop={6}
                        className="rounded-lg bg-danger/10 p-1.5 active:opacity-75"
                      >
                        <Trash2 size={14} color={COLORS.danger} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Create / Edit Bottom Sheet */}
      <AppSheet
        visible={sheetVisible}
        title={editingItem ? 'Editar tasa personalizada' : 'Nueva tasa personalizada'}
        subtitle="Elige un emoji, nombre y regla de cálculo"
        onClose={() => setSheetVisible(false)}
        footer={
          <Pressable
            onPress={handleSave}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
            style={{
              backgroundColor: COLORS.primary,
              borderCurve: 'continuous',
            }}
          >
            <Check size={17} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-sm font-medium text-white">
              {editingItem ? 'Guardar cambios' : 'Crear tasa'}
            </Text>
          </Pressable>
        }
      >
        <View className="gap-4">
          {/* Emoji Selector + Custom Input */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-text-secondary">
                Icono o emoji
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[11px] text-text-muted">Otro:</Text>
                <TextInput
                  value={emoji}
                  onChangeText={(txt) => setEmoji(txt.slice(-4))}
                  maxLength={4}
                  textAlign="center"
                  className="w-11 rounded-lg border border-border bg-surface-elevated"
                  style={[
                    { borderColor: COLORS.border },
                    singleLineInputStyle({
                      color: COLORS.textPrimary,
                      fontSize: 16,
                      height: 34,
                    }),
                  ]}
                />
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {CUSTOM_RATE_EMOJI_PRESETS.map((preset) => {
                const selected = emoji === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      triggerSelectionHaptic();
                      setEmoji(preset);
                    }}
                    className="h-10 w-10 items-center justify-center rounded-xl border active:opacity-80"
                    style={{
                      backgroundColor: selected
                        ? `${COLORS.primary}20`
                        : COLORS.surfaceElevated,
                      borderColor: selected ? COLORS.primary : COLORS.border,
                      borderCurve: 'continuous',
                    }}
                  >
                    <Text className="text-xl">{preset}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Label */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Nombre identificador *
            </Text>
            <View
              className="h-11 flex-row items-center gap-2 rounded-xl border bg-surface-elevated px-3.5"
              style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
            >
              <TextInput
                value={label}
                onChangeText={(txt) => {
                  if (formError) setFormError(null);
                  setLabel(txt);
                }}
                placeholder="Ej. Tasa Comercio, Bodega, Punto"
                placeholderTextColor={COLORS.textMuted}
                maxLength={28}
                className="flex-1"
                style={singleLineInputStyle({ color: COLORS.textPrimary })}
              />
              <ClearInputButton
                visible={label.length > 0}
                onPress={() => {
                  if (formError) setFormError(null);
                  setLabel('');
                }}
              />
            </View>
          </View>

          {/* Mode */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Tipo de cálculo
            </Text>
            <SegmentedControl
              options={MODE_OPTIONS}
              selected={mode}
              onSelect={(next) => {
                const prevIdx = MODE_OPTIONS.findIndex((o) => o.id === mode);
                const nextIdx = MODE_OPTIONS.findIndex((o) => o.id === next);
                if (formError) setFormError(null);
                setMode(next);
                triggerTransition(nextIdx, prevIdx);
              }}
            />
          </View>

          <Animated.View style={transitionStyle}>
            {mode === 'average' && (
              <View
                className="rounded-xl border border-border bg-surface-elevated px-3.5 py-3"
                style={{ borderCurve: 'continuous' }}
              >
                <Text className="text-xs text-text-secondary">
                  Promedia automáticamente BCV $ y USDT Yadio: (BCV + USDT) ÷ 2.
                </Text>
              </View>
            )}

            {mode === 'fixed' && (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-text-secondary">
                  Valor fijo (Bs por 1 $) *
                </Text>
                <View
                  className="h-12 flex-row items-center gap-2 rounded-xl border bg-surface-elevated px-3.5"
                  style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
                >
                  <TextInput
                    value={fixedText}
                    onChangeText={(txt) => {
                      if (formError) setFormError(null);
                      setFixedText(sanitizeDecimalInput(txt, fixedText));
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    className="flex-1"
                    style={singleLineInputStyle({
                      color: COLORS.textPrimary,
                      fontSize: 16,
                      height: 48,
                      weight: 'bold',
                      tabularNums: true,
                    })}
                  />
                  <ClearInputButton
                    visible={fixedText.length > 0}
                    onPress={() => {
                      if (formError) setFormError(null);
                      setFixedText('');
                    }}
                  />
                </View>
              </View>
            )}

            {mode === 'margin' && (
              <View className="gap-3">
                <View className="gap-1.5">
                  <Text className="text-xs font-semibold text-text-secondary">
                    Tasa base
                  </Text>
                  <SegmentedControl
                    options={BASE_OPTIONS}
                    selected={base}
                    onSelect={setBase}
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-xs font-semibold text-text-secondary">
                    Ajuste porcentual (%) *
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {MARGIN_PRESETS.map((preset) => (
                      <SelectableChip
                        key={preset}
                        label={preset > 0 ? `+${preset}%` : `${preset}%`}
                        active={parsedMargin === preset}
                        onPress={() => {
                          if (formError) setFormError(null);
                          setMarginText(String(preset));
                        }}
                      />
                    ))}
                  </View>
                  <View
                    className="mt-1 h-11 flex-row items-center gap-2 rounded-xl border bg-surface-elevated px-3.5"
                    style={{ borderColor: COLORS.border, borderCurve: 'continuous' }}
                  >
                    <TextInput
                      value={marginText}
                      onChangeText={(txt) => {
                        if (formError) setFormError(null);
                        setMarginText(sanitizeSignedDecimal(txt, marginText));
                      }}
                      keyboardType="numbers-and-punctuation"
                      placeholder="Ej. 3 o -2.5"
                      placeholderTextColor={COLORS.textMuted}
                      className="flex-1"
                      style={singleLineInputStyle({
                        color: COLORS.textPrimary,
                        weight: 'semibold',
                        tabularNums: true,
                      })}
                    />
                    <ClearInputButton
                      visible={marginText.length > 0}
                      onPress={() => {
                        if (formError) setFormError(null);
                        setMarginText('');
                      }}
                    />
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Rounding */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Redondeo opcional hacia arriba
            </Text>
            <SegmentedControl
              scrollable
              compact
              options={CUSTOM_RATE_ROUNDING_OPTIONS.map((opt) => ({
                id: String(opt.value),
                label: opt.label,
              }))}
              selected={String(rounding)}
              onSelect={(val) => setRounding(Number(val) as CustomRateRounding)}
            />
          </View>

          {formError ? (
            <Text className="text-xs font-medium text-danger">{formError}</Text>
          ) : null}

          {/* Live Preview */}
          <View
            className="flex-row items-center justify-between rounded-2xl border p-3.5"
            style={{
              backgroundColor: `${COLORS.primary}12`,
              borderColor: `${COLORS.primary}40`,
              borderCurve: 'continuous',
            }}
          >
            <View className="flex-row items-center gap-2">
              <SlidersHorizontal size={16} color={COLORS.primary} />
              <Text className="text-xs font-semibold text-text-secondary">
                Vista previa
              </Text>
            </View>
            <Text
              className="text-base font-bold"
              style={{
                color: COLORS.primary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {draftPreviewRate > 0
                ? `${emoji || '🏪'} 1 $ = ${formatNumber(draftPreviewRate, 2)} Bs`
                : 'Ingresa un monto válido'}
            </Text>
          </View>
        </View>
      </AppSheet>

      <AppModal
        visible={deleteTarget !== null}
        title="Eliminar tasa personalizada"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.label ?? ''}"?`}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (deleteTarget) {
            deleteCustomRate(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}
