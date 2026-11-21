import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Minus,
  Pencil,
  Plus,
  Share2,
  UserPlus,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { AppSheet } from '@/components/ui/AppSheet';
import { Card } from '@/components/ui/Card';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { RateSourceSelector } from '@/components/ui/RateSourceSelector';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useEffectiveRates } from '@/hooks/useEffectiveRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBillSplitStore } from '@/store/billSplitStore';
import type { SplitPerson } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { getDefaultRateSourceForCurrency } from '@/utils/customRateUtils';
import { formatNumber, parseFormattedNumber } from '@/utils/formatters';
import {
  triggerNotificationHaptic,
  triggerSelectionHaptic,
} from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import { copyToClipboard, shareTextContent } from '@/utils/shareUtils';
import { sanitizeDecimalInput } from '@/utils/shoppingUtils';
import {
  buildSplitShareText,
  computeSplitSummary,
  getPersonShareConstraints,
} from '@/utils/splitUtils';

type TipOptionId = '0' | '10' | '15' | '20' | 'fixed';

const TIP_OPTIONS: Array<{ id: TipOptionId; label: string }> = [
  { id: '0', label: 'Sin' },
  { id: '10', label: '10%' },
  { id: '15', label: '15%' },
  { id: '20', label: '20%' },
  { id: 'fixed', label: 'Fija' },
];

export default function BillSplitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { snapshot, sourceOptions } = useEffectiveRates();

  const split = useBillSplitStore((state) =>
    state.splits.find((item) => item.id === id),
  );
  const {
    updateSplitMeta,
    setPeopleCount,
    updatePerson,
    clearCustomAmounts,
    togglePersonPaid,
  } = useBillSplitStore();

  const [totalText, setTotalText] = useState(
    split && split.total > 0 ? String(split.total) : '',
  );
  const [fixedTipText, setFixedTipText] = useState(
    split && split.tipMode === 'fixed' && split.tipValue > 0
      ? String(split.tipValue)
      : '',
  );
  const [editingPerson, setEditingPerson] = useState<SplitPerson | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCustomAmount, setDraftCustomAmount] = useState('');
  const [personError, setPersonError] = useState<string | null>(null);

  useEffect(() => {
    if (
      split &&
      split.ratesSnapshot.usdToVes === 0 &&
      snapshot.usdToVes > 0
    ) {
      updateSplitMeta(split.id, { ratesSnapshot: snapshot });
    }
  }, [snapshot, split, updateSplitMeta]);

  if (!split) {
    return (
      <View
        className="flex-1 bg-surface"
        style={{ backgroundColor: COLORS.surface }}
      >
        <ScreenHero
          title="Cuenta no encontrada"
          leftAction={
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
          }
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-text-secondary">
            Esta cuenta compartida no existe o fue eliminada.
          </Text>
        </View>
      </View>
    );
  }

  const summary = computeSplitSummary(split);
  const sym = CURRENCY_SYMBOLS[split.currency];
  const progressRatio =
    summary.totalCount > 0 ? summary.paidCount / summary.totalCount : 0;

  const editConstraints = editingPerson
    ? getPersonShareConstraints(split, editingPerson.id, summary.grandTotal)
    : null;
  const parsedDraftCustom = draftCustomAmount.trim()
    ? parseFormattedNumber(draftCustomAmount)
    : undefined;
  const editRemainingCents = editConstraints
    ? Math.round(editConstraints.remainingTotal * 100)
    : 0;
  const editCustomCents =
    parsedDraftCustom !== undefined
      ? Math.round(parsedDraftCustom * 100)
      : null;
  const shortfallAmount =
    editConstraints &&
    editConstraints.isLastFreePerson &&
    summary.grandTotal > 0 &&
    editCustomCents !== null &&
    editCustomCents < editRemainingCents
      ? (editRemainingCents - editCustomCents) / 100
      : 0;

  const openPersonEdit = (person: SplitPerson) => {
    triggerSelectionHaptic();
    setPersonError(null);
    setEditingPerson(person);
    setDraftName(person.name);
    setDraftCustomAmount(
      person.customAmount !== undefined ? String(person.customAmount) : '',
    );
  };

  const savePersonEdit = (addExtraPerson = false) => {
    if (!editingPerson || !editConstraints) return;
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setPersonError('Ingresa un nombre para este participante.');
      return;
    }

    const parsedCustom = parsedDraftCustom;
    const grandTotalCents = Math.round(summary.grandTotal * 100);

    if (parsedCustom !== undefined && grandTotalCents > 0) {
      const customCents = Math.round(parsedCustom * 100);
      if (customCents > editRemainingCents) {
        setPersonError(
          editConstraints.otherCustomTotal > 0
            ? `El monto excede el restante disponible (${sym} ${formatNumber(editConstraints.remainingTotal)}).`
            : 'El monto fijo no puede superar el total de la cuenta.',
        );
        return;
      }

      if (
        editConstraints.isLastFreePerson &&
        customCents < editRemainingCents &&
        !addExtraPerson
      ) {
        const missing = (editRemainingCents - customCents) / 100;
        setPersonError(
          split.people.length < 30
            ? `Faltan ${sym} ${formatNumber(missing)} para completar el total. Debe ser ${sym} ${formatNumber(editConstraints.remainingTotal)} o agrega otro participante.`
            : `Faltan ${sym} ${formatNumber(missing)} para completar el total (límite de 30 personas alcanzado).`,
        );
        return;
      }
    }

    triggerSelectionHaptic();
    updatePerson(split.id, editingPerson.id, {
      name: trimmedName,
      customAmount: parsedCustom,
    });
    if (addExtraPerson && split.people.length < 30) {
      setPeopleCount(split.id, split.people.length + 1);
    }
    setEditingPerson(null);
  };

  const handleTotalChange = (txt: string) => {
    const clean = sanitizeDecimalInput(txt, totalText);
    setTotalText(clean);
    updateSplitMeta(split.id, {
      total: clean ? parseFormattedNumber(clean) : 0,
    });
  };

  const activeTipOption: TipOptionId =
    split.tipMode === 'fixed'
      ? 'fixed'
      : split.tipMode === 'percent' &&
          (split.tipValue === 10 ||
            split.tipValue === 15 ||
            split.tipValue === 20)
        ? (String(split.tipValue) as TipOptionId)
        : '0';

  const handleSelectTipOption = (opt: TipOptionId) => {
    if (opt === 'fixed') {
      const nextFixed = fixedTipText
        ? parseFormattedNumber(fixedTipText)
        : split.tipMode === 'fixed'
          ? split.tipValue
          : 0;
      if (nextFixed > 0 && !fixedTipText) {
        setFixedTipText(String(nextFixed));
      }
      updateSplitMeta(split.id, { tipMode: 'fixed', tipValue: nextFixed });
      return;
    }

    const pct = Number(opt);
    if (pct === 0) {
      updateSplitMeta(split.id, { tipMode: 'none', tipValue: 0 });
    } else {
      updateSplitMeta(split.id, { tipMode: 'percent', tipValue: pct });
    }
  };

  const handleShare = () => {
    triggerSelectionHaptic();
    const text = buildSplitShareText(split, summary);
    void shareTextContent(text, split.title);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHero
        title={split.title}
        subtitle={`Cobrado ${summary.paidCount}/${summary.totalCount} personas`}
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
            onPress={handleShare}
            hitSlop={8}
            className="flex-row items-center gap-1 rounded-xl px-2.5 py-2 active:opacity-80"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Share2 size={15} color="#ffffff" />
            <Text className="text-xs font-medium text-white">Enviar</Text>
          </Pressable>
        }
      >
        <View className="rounded-2xl bg-black/15 p-3.5">
          <View className="flex-row items-baseline justify-between gap-2">
            <View>
              <Text className="text-[11px] text-white/80">Total + propina</Text>
              <Text
                className="text-2xl font-bold text-white"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {sym} {formatNumber(summary.grandTotal)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-white/80">Por cobrar</Text>
              <Text
                className="text-base font-bold text-white"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {sym} {formatNumber(summary.pendingAmount)}
                {split.currency !== 'VES' &&
                summary.pendingEquivalents.VES > 0
                  ? ` (${formatNumber(summary.pendingEquivalents.VES)} Bs)`
                  : ''}
              </Text>
            </View>
          </View>

          <View className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </View>
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
        {/* Bill Config Card */}
        <Card title="Configurar cuenta">
          <View className="gap-3.5">
            <View className="gap-1">
              <View className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
                <Text
                  className="text-lg font-bold"
                  style={{ color: COLORS.primary }}
                >
                  {sym}
                </Text>
                <TextInput
                  value={totalText}
                  onChangeText={handleTotalChange}
                  keyboardType="decimal-pad"
                  placeholder="Total factura"
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
                  onPress={() => handleTotalChange('')}
                />
              </View>
              {split.total <= 0 ? (
                <Text className="text-[11px] font-medium text-danger">
                  Ingresa un monto mayor a 0 para repartir la cuenta.
                </Text>
              ) : null}
            </View>

            <CurrencyChipRow
              selected={split.currency}
              onSelect={(code) =>
                updateSplitMeta(split.id, {
                  currency: code,
                  ...(!split.rateSource.startsWith('CUSTOM:') && code !== 'VES'
                    ? { rateSource: getDefaultRateSourceForCurrency(code) }
                    : {}),
                })
              }
            />

            {/* Tip */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Propina opcional
              </Text>
              <SegmentedControl
                options={TIP_OPTIONS}
                selected={activeTipOption}
                onSelect={handleSelectTipOption}
              />

              {split.tipMode === 'fixed' && (
                <Animated.View entering={FadeInDown.duration(180)}>
                  <View className="mt-1 h-11 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
                    <TextInput
                      value={fixedTipText}
                      onChangeText={(txt) => {
                        const clean = sanitizeDecimalInput(txt, fixedTipText);
                        setFixedTipText(clean);
                        updateSplitMeta(split.id, {
                          tipValue: clean ? parseFormattedNumber(clean) : 0,
                        });
                      }}
                      keyboardType="decimal-pad"
                      placeholder={`Propina fija en ${split.currency}`}
                      placeholderTextColor={COLORS.textMuted}
                      className="flex-1"
                      style={singleLineInputStyle({
                        color: COLORS.textPrimary,
                        weight: 'semibold',
                        tabularNums: true,
                      })}
                    />
                    <ClearInputButton
                      visible={fixedTipText.length > 0}
                      onPress={() => {
                        setFixedTipText('');
                        updateSplitMeta(split.id, { tipValue: 0 });
                      }}
                    />
                  </View>
                </Animated.View>
              )}
            </View>

            {/* People Stepper */}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-text-secondary">
                Dividir entre personas
              </Text>
              <View className="flex-row items-center gap-2.5">
                <Pressable
                  onPress={() => {
                    triggerSelectionHaptic();
                    setPeopleCount(split.id, split.people.length - 1);
                  }}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated active:opacity-75"
                >
                  <Minus size={14} color={COLORS.textPrimary} />
                </Pressable>
                <Text className="min-w-[24px] text-center text-sm font-bold text-text-primary">
                  {split.people.length}
                </Text>
                <Pressable
                  onPress={() => {
                    triggerSelectionHaptic();
                    setPeopleCount(split.id, split.people.length + 1);
                  }}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated active:opacity-75"
                >
                  <Plus size={14} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>

            {/* Rate Source */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-text-secondary">
                Tasa para equivalentes:
              </Text>
              <RateSourceSelector
                options={sourceOptions}
                selected={split.rateSource}
                onSelect={(src) =>
                  updateSplitMeta(split.id, {
                    rateSource: src,
                    ratesSnapshot: snapshot,
                  })
                }
              />
            </View>
          </View>
        </Card>

        {/* People Shares */}
        <Card
          title="Cuotas por persona"
          headerRight={
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                void copyToClipboard(
                  buildSplitShareText(split, summary),
                  'Resumen copiado',
                );
              }}
              className="flex-row items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-1"
            >
              <Copy size={12} color={COLORS.primary} />
              <Text
                className="text-[11px] font-medium"
                style={{ color: COLORS.primary }}
              >
                Copiar lista
              </Text>
            </Pressable>
          }
        >
          <View className="gap-2.5">
            {Math.abs(summary.differenceAmount) > 0.005 && (
              <View
                className="gap-2 rounded-xl border p-3"
                style={{
                  backgroundColor: `${COLORS.danger}12`,
                  borderColor: `${COLORS.danger}45`,
                  borderCurve: 'continuous',
                }}
              >
                <View className="flex-row items-start gap-2">
                  <AlertTriangle size={15} color={COLORS.danger} />
                  <Text className="flex-1 text-xs font-medium text-text-primary">
                    {summary.differenceAmount > 0
                      ? `Faltan ${sym} ${formatNumber(summary.differenceAmount)} para cuadrar el total de la cuenta.`
                      : `Las cuotas fijas superan el total por ${sym} ${formatNumber(Math.abs(summary.differenceAmount))}.`}
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {summary.differenceAmount > 0 && split.people.length < 30 && (
                    <Pressable
                      onPress={() => {
                        triggerSelectionHaptic();
                        setPeopleCount(split.id, split.people.length + 1);
                      }}
                      className="flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 active:opacity-85"
                      style={{
                        backgroundColor: COLORS.primary,
                        borderCurve: 'continuous',
                      }}
                    >
                      <UserPlus size={13} color="#ffffff" />
                      <Text className="text-xs font-medium text-white">
                        Agregar persona ({sym}{' '}
                        {formatNumber(summary.differenceAmount)})
                      </Text>
                    </Pressable>
                  )}
                  {summary.customCount > 0 && (
                    <Pressable
                      onPress={() => {
                        triggerSelectionHaptic();
                        clearCustomAmounts(split.id);
                      }}
                      className="rounded-lg border border-border bg-surface-card px-3 py-1.5 active:opacity-80"
                    >
                      <Text className="text-xs font-medium text-text-primary">
                        Repartir igual
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {summary.shares.map(({ person, amount, isCustom, equivalents }) => (
              <View
                key={person.id}
                className="rounded-xl border p-3"
                style={{
                  backgroundColor: COLORS.surfaceElevated,
                  borderColor: person.paid ? COLORS.success : COLORS.border,
                  borderCurve: 'continuous',
                }}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Pressable
                    onPress={() => openPersonEdit(person)}
                    className="flex-1 flex-row items-center gap-1.5"
                  >
                    <Text
                      className="text-sm font-bold text-text-primary"
                      numberOfLines={1}
                    >
                      {person.name}
                    </Text>
                    <Pencil size={12} color={COLORS.textMuted} />
                    {isCustom && (
                      <View
                        className="rounded-full px-1.5 py-0.5"
                        style={{ backgroundColor: `${COLORS.primary}20` }}
                      >
                        <Text
                          className="text-[9px] font-semibold"
                          style={{ color: COLORS.primary }}
                        >
                          Fijo
                        </Text>
                      </View>
                    )}
                    {!isCustom &&
                      summary.customCount > 0 &&
                      summary.autoCount === 1 && (
                        <View
                          className="rounded-full px-1.5 py-0.5"
                          style={{ backgroundColor: `${COLORS.success}20` }}
                        >
                          <Text
                            className="text-[9px] font-semibold"
                            style={{ color: COLORS.success }}
                          >
                            Restante
                          </Text>
                        </View>
                      )}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (!person.paid) {
                        triggerNotificationHaptic('success');
                      } else {
                        triggerSelectionHaptic();
                      }
                      togglePersonPaid(split.id, person.id);
                    }}
                    className="flex-row items-center gap-1 rounded-full px-3 py-1 active:opacity-80"
                    style={{
                      backgroundColor: person.paid
                        ? COLORS.success
                        : COLORS.surfaceCard,
                    }}
                  >
                    {person.paid && <CheckCircle2 size={12} color="#ffffff" />}
                    <Text
                      className="text-[11px] font-medium"
                      style={{
                        color: person.paid ? '#ffffff' : COLORS.textSecondary,
                      }}
                    >
                      {person.paid ? 'Pagó' : 'Pendiente'}
                    </Text>
                  </Pressable>
                </View>

                <View className="mt-2 flex-row items-end justify-between gap-2">
                  <View>
                    <Text
                      className="text-lg font-bold text-text-primary"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {sym} {formatNumber(amount)}
                    </Text>
                    <Text
                      className="text-[11px] text-text-secondary"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {split.currency !== 'VES'
                        ? `${formatNumber(equivalents.VES)} Bs`
                        : `$ ${formatNumber(equivalents.USD)}`}
                      {split.currency !== 'USDT'
                        ? ` • ${formatNumber(equivalents.USDT)} ₮`
                        : ''}
                    </Text>
                  </View>

                  {!person.paid && amount > 0 && (
                    <Pressable
                      onPress={() => {
                        triggerSelectionHaptic();
                        router.push({
                          pathname: '/tools/payments',
                          params: {
                            amount: amount.toFixed(2),
                            currency: split.currency,
                          },
                        });
                      }}
                      className="flex-row items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1.5 active:opacity-75"
                    >
                      <CreditCard size={12} color={COLORS.primary} />
                      <Text
                        className="text-[11px] font-medium"
                        style={{ color: COLORS.primary }}
                      >
                        Cobrar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}

            {split.people.length < 30 && (
              <Pressable
                onPress={() => {
                  triggerSelectionHaptic();
                  setPeopleCount(split.id, split.people.length + 1);
                }}
                className="flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-elevated py-2.5 active:opacity-80"
                style={{ borderCurve: 'continuous' }}
              >
                <UserPlus size={14} color={COLORS.primary} />
                <Text
                  className="text-xs font-medium"
                  style={{ color: COLORS.primary }}
                >
                  Agregar persona
                </Text>
              </Pressable>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Edit Person Modal Sheet */}
      <AppSheet
        visible={editingPerson !== null}
        title="Editar participante"
        subtitle="Cambia el nombre o asigna un monto fijo personalizado"
        onClose={() => setEditingPerson(null)}
        footer={
          <Pressable
            onPress={() => savePersonEdit(false)}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
            style={{
              backgroundColor: COLORS.primary,
              borderCurve: 'continuous',
            }}
          >
            <Check size={17} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-sm font-medium text-white">Guardar</Text>
          </Pressable>
        }
      >
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Nombre *
            </Text>
            <TextInput
              value={draftName}
              onChangeText={(txt) => {
                if (personError) setPersonError(null);
                setDraftName(txt);
              }}
              placeholder="Ej. Carlos"
              placeholderTextColor={COLORS.textMuted}
              maxLength={32}
              className="rounded-xl border border-border bg-surface-elevated px-3.5"
              style={singleLineInputStyle({ color: COLORS.textPrimary })}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Monto fijo opcional en {split.currency} (deja vacío para dividir
              igual)
            </Text>
            <View className="h-11 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
              <TextInput
                value={draftCustomAmount}
                onChangeText={(txt) => {
                  if (personError) setPersonError(null);
                  setDraftCustomAmount(
                    sanitizeDecimalInput(txt, draftCustomAmount),
                  );
                }}
                keyboardType="decimal-pad"
                placeholder={
                  editConstraints && summary.grandTotal > 0
                    ? editConstraints.isLastFreePerson
                      ? `Restante requerido: ${sym} ${formatNumber(editConstraints.remainingTotal)}`
                      : `Automático (disp. ${sym} ${formatNumber(editConstraints.remainingTotal)})`
                    : 'Automático (equitativo)'
                }
                placeholderTextColor={COLORS.textMuted}
                className="flex-1"
                style={singleLineInputStyle({
                  color: COLORS.textPrimary,
                  weight: 'semibold',
                  tabularNums: true,
                })}
              />
              <ClearInputButton
                visible={draftCustomAmount.length > 0}
                onPress={() => {
                  if (personError) setPersonError(null);
                  setDraftCustomAmount('');
                }}
              />
            </View>

            {editConstraints && summary.grandTotal > 0 && (
              <Text className="text-[11px] text-text-muted">
                {editConstraints.isLastFreePerson
                  ? `No quedan personas en automático: debe cubrir ${sym} ${formatNumber(editConstraints.remainingTotal)} o agregar otro participante.`
                  : `Restante disponible para repartir: ${sym} ${formatNumber(editConstraints.remainingTotal)}.`}
              </Text>
            )}
          </View>

          {shortfallAmount > 0 && split.people.length < 30 && (
            <View
              className="gap-2 rounded-xl border p-3"
              style={{
                backgroundColor: `${COLORS.primary}12`,
                borderColor: `${COLORS.primary}45`,
                borderCurve: 'continuous',
              }}
            >
              <Text className="text-xs text-text-secondary">
                Faltan{' '}
                <Text
                  className="font-semibold text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {sym} {formatNumber(shortfallAmount)}
                </Text>{' '}
                para completar el total. Puedes agregar otra persona para que
                cubra ese restante:
              </Text>
              <Pressable
                onPress={() => savePersonEdit(true)}
                className="flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 active:opacity-85"
                style={{
                  backgroundColor: COLORS.primary,
                  borderCurve: 'continuous',
                }}
              >
                <UserPlus size={14} color="#ffffff" />
                <Text className="text-xs font-medium text-white">
                  Guardar y agregar persona (+{sym}{' '}
                  {formatNumber(shortfallAmount)})
                </Text>
              </Pressable>
            </View>
          )}

          {personError ? (
            <Text className="text-xs font-medium text-danger">{personError}</Text>
          ) : null}
        </View>
      </AppSheet>
    </KeyboardAvoidingView>
  );
}
