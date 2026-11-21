import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Pencil,
  Share2,
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
import { PaymentTemplateSheet } from '@/components/tools/PaymentTemplateSheet';
import { AppModal } from '@/components/ui/AppModal';
import { Card } from '@/components/ui/Card';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { RateSourceSelector } from '@/components/ui/RateSourceSelector';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { formatBankLabel } from '@/constants/banks';
import { useEffectiveRates } from '@/hooks/useEffectiveRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePaymentTemplatesStore } from '@/store/paymentTemplatesStore';
import type { CurrencyCode, RateSourceId } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { convertWithRateSource, getDefaultRateSourceForCurrency } from '@/utils/customRateUtils';
import {
  formatBankAmount,
  formatNumber,
  parseFormattedNumber,
} from '@/utils/formatters';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import {
  PAYMENT_METHOD_LABELS,
  buildPaymentShareMessage,
  formatPhoneDisplay,
} from '@/utils/paymentFormat';
import { copyToClipboard, shareTextContent } from '@/utils/shareUtils';
import { sanitizeDecimalInput } from '@/utils/shoppingUtils';

function CopyFieldRow({
  label,
  value,
  copyValue,
  isLast,
}: {
  label: string;
  value: string;
  copyValue?: string;
  isLast?: boolean;
}) {
  const COLORS = useThemeColors();
  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        void copyToClipboard(copyValue ?? value, `${label} copiado`);
      }}
      className={`flex-row items-center justify-between py-2.5 active:opacity-75 ${
        !isLast ? 'border-b border-border/50' : ''
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-[11px] text-text-muted">{label}</Text>
        <Text className="text-sm font-semibold text-text-primary">{value}</Text>
      </View>
      <View className="flex-row items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-1.5">
        <Copy size={12} color={COLORS.primary} />
        <Text
          className="text-[11px] font-medium"
          style={{ color: COLORS.primary }}
        >
          Copiar
        </Text>
      </View>
    </Pressable>
  );
}

export default function PaymentTemplateDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    amount?: string;
    currency?: string;
  }>();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { snapshot, sourceOptions } = useEffectiveRates();

  const template = usePaymentTemplatesStore((state) =>
    state.templates.find((item) => item.id === params.id),
  );
  const { updateTemplate, deleteTemplate } = usePaymentTemplatesStore();

  const initialCurrency: CurrencyCode =
    params.currency === 'USD' ||
    params.currency === 'EUR' ||
    params.currency === 'USDT' ||
    params.currency === 'VES'
      ? params.currency
      : template?.type === 'binance' || template?.type === 'zelle'
        ? 'USD'
        : 'USD';

  const [amountText, setAmountText] = useState(params.amount ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [rateSource, setRateSource] = useState<RateSourceId>(() =>
    getDefaultRateSourceForCurrency(initialCurrency),
  );
  const [includeEquivalents, setIncludeEquivalents] = useState(true);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCurrencyChange = (nextCurrency: CurrencyCode) => {
    setCurrency(nextCurrency);
    if (!rateSource.startsWith('CUSTOM:') && nextCurrency !== 'VES') {
      setRateSource(getDefaultRateSourceForCurrency(nextCurrency));
    }
  };

  if (!template) {
    return (
      <View
        className="flex-1 bg-surface"
        style={{ backgroundColor: COLORS.surface }}
      >
        <ScreenHero
          title="Plantilla no encontrada"
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
            Esta plantilla fue eliminada.
          </Text>
        </View>
      </View>
    );
  }

  const parsedAmount = amountText ? parseFormattedNumber(amountText) : 0;
  const conversions = convertWithRateSource(
    parsedAmount,
    currency,
    rateSource,
    snapshot,
  );
  const bankVesAmount = formatBankAmount(conversions.VES);

  const fullMessage = buildPaymentShareMessage({
    template,
    amount: parsedAmount,
    currency,
    rateSource,
    snapshot,
    includeEquivalents,
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHero
        title={template.alias}
        subtitle={PAYMENT_METHOD_LABELS[template.type]}
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
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                setShowEditSheet(true);
              }}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-xl active:opacity-80"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Pencil size={15} color="#ffffff" />
            </Pressable>
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                setShowDeleteModal(true);
              }}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-xl active:opacity-80"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Trash2 size={15} color="#ffffff" />
            </Pressable>
          </View>
        }
      />

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
        {/* Optional Amount & Conversion */}
        <Card title="Monto opcional a incluir">
          <View className="gap-3">
            <CurrencyChipRow
              selected={currency}
              onSelect={handleCurrencyChange}
            />
            <View className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
              <Text
                className="text-lg font-bold"
                style={{ color: COLORS.primary }}
              >
                {CURRENCY_SYMBOLS[currency]}
              </Text>
              <TextInput
                value={amountText}
                onChangeText={(txt) =>
                  setAmountText(sanitizeDecimalInput(txt, amountText))
                }
                keyboardType="decimal-pad"
                placeholder="Sin monto (opcional)"
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
                visible={amountText.length > 0}
                onPress={() => setAmountText('')}
              />
            </View>

            <View className="gap-1">
              <Text className="text-xs font-medium text-text-secondary">
                Tasa de conversión a Bolívares:
              </Text>
              <RateSourceSelector
                options={sourceOptions}
                selected={rateSource}
                onSelect={setRateSource}
              />
            </View>

            {parsedAmount > 0 && (
              <>
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="text-[11px] font-medium text-text-muted">
                    Equivalentes:
                  </Text>
                  <Text
                    className="text-xs font-semibold text-text-secondary"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatNumber(conversions.USD)} $ •{' '}
                    {currency === 'EUR' || rateSource === 'BCV_EUR'
                      ? `${formatNumber(conversions.EUR)} € • `
                      : ''}
                    {formatNumber(conversions.USDT)} ₮ •{' '}
                    {formatNumber(conversions.VES)} Bs
                  </Text>
                </View>

                <View className="flex-row items-center justify-between rounded-xl bg-surface-elevated px-3 py-2.5">
                  <View>
                    <Text className="text-[10px] text-text-muted">
                      Monto exacto para app bancaria
                    </Text>
                    <Text
                      className="text-base font-bold text-text-primary"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {bankVesAmount} Bs
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      triggerSelectionHaptic();
                      void copyToClipboard(
                        bankVesAmount,
                        `Monto ${bankVesAmount} copiado sin puntos`,
                      );
                    }}
                    className="flex-row items-center gap-1 rounded-xl px-3 py-2 active:opacity-85"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Copy size={13} color="#ffffff" />
                    <Text className="text-xs font-medium text-white">
                      Copiar Bs
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => setIncludeEquivalents((prev) => !prev)}
                  className="flex-row items-center justify-between pt-1"
                >
                  <Text className="text-xs text-text-secondary">
                    Incluir equivalencia en el mensaje
                  </Text>
                  <Switch
                    value={includeEquivalents}
                    onValueChange={setIncludeEquivalents}
                    trackColor={{
                      false: COLORS.border,
                      true: `${COLORS.primary}80`,
                    }}
                    thumbColor={
                      includeEquivalents ? COLORS.primary : COLORS.textMuted
                    }
                  />
                </Pressable>
              </>
            )}
          </View>
        </Card>

        {/* Tap-to-copy individual fields */}
        <Card title="Datos guardados (toca cualquier dato para copiar)">
          {template.holderName ? (
            <CopyFieldRow label="Titular" value={template.holderName} />
          ) : null}

          {template.type === 'pago_movil' && (
            <>
              <CopyFieldRow
                label="Banco"
                value={formatBankLabel(template.bankCode)}
                copyValue={template.bankCode}
              />
              <CopyFieldRow
                label="Teléfono"
                value={formatPhoneDisplay(template.phone)}
                copyValue={template.phone}
              />
              <CopyFieldRow
                label="Cédula / RIF"
                value={`${template.idPrefix}-${template.idNumber}`}
                copyValue={template.idNumber}
                isLast
              />
            </>
          )}

          {template.type === 'transferencia' && (
            <>
              <CopyFieldRow
                label="Banco"
                value={formatBankLabel(template.bankCode)}
                copyValue={template.bankCode}
              />
              <CopyFieldRow
                label="Número de cuenta"
                value={template.accountNumber}
              />
              <CopyFieldRow
                label="Cédula / RIF"
                value={`${template.idPrefix}-${template.idNumber}`}
                copyValue={template.idNumber}
                isLast
              />
            </>
          )}

          {template.type === 'binance' && (
            <>
              {template.payId ? (
                <CopyFieldRow label="Binance Pay ID" value={template.payId} />
              ) : null}
              {template.email ? (
                <CopyFieldRow label="Correo Binance" value={template.email} />
              ) : null}
              {template.username ? (
                <CopyFieldRow
                  label="Usuario"
                  value={`@${template.username}`}
                  copyValue={template.username}
                  isLast
                />
              ) : null}
            </>
          )}

          {template.type === 'zelle' && (
            <CopyFieldRow label="Correo / Teléfono Zelle" value={template.email} isLast />
          )}

          {template.type === 'otro' && (
            <CopyFieldRow label="Datos" value={template.freeText} isLast />
          )}
        </Card>

        {/* Preview & Quick Share */}
        <Card title="Vista previa del mensaje">
          <View className="rounded-xl bg-surface-elevated p-3">
            <Text className="text-xs leading-5 text-text-primary">
              {fullMessage}
            </Text>
          </View>

          <View className="mt-3 flex-row gap-2.5">
            <Pressable
              onPress={() => {
                triggerImpactHaptic('light');
                void copyToClipboard(fullMessage, 'Plantilla completa copiada');
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated py-3 active:opacity-80"
            >
              <Copy size={15} color={COLORS.textPrimary} />
              <Text className="text-xs font-medium text-text-primary">
                Copiar todo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerImpactHaptic('light');
                void shareTextContent(fullMessage, template.alias);
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 active:opacity-85"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Share2 size={15} color="#ffffff" />
              <Text className="text-xs font-medium text-white">Compartir</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>

      <PaymentTemplateSheet
        visible={showEditSheet}
        editingTemplate={template}
        onSave={(input) => updateTemplate(template.id, input)}
        onClose={() => setShowEditSheet(false)}
      />

      <AppModal
        visible={showDeleteModal}
        title="Eliminar plantilla"
        message={`¿Seguro que deseas eliminar "${template.alias}"?`}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          deleteTemplate(template.id);
          setShowDeleteModal(false);
          router.back();
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </KeyboardAvoidingView>
  );
}
