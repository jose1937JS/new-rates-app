import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Landmark,
  Plus,
  Smartphone,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaymentTemplateSheet } from '@/components/tools/PaymentTemplateSheet';
import { AppModal } from '@/components/ui/AppModal';
import { Card } from '@/components/ui/Card';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useEffectiveRates } from '@/hooks/useEffectiveRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePaymentTemplatesStore } from '@/store/paymentTemplatesStore';
import type {
  CurrencyCode,
  PaymentMethodType,
  PaymentTemplate,
} from '@/types/currency.types';
import { getDefaultRateSourceForCurrency } from '@/utils/customRateUtils';
import { parseFormattedNumber } from '@/utils/formatters';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/utils/haptics';
import {
  PAYMENT_METHOD_LABELS,
  buildPaymentShareMessage,
  getTemplateSummary,
} from '@/utils/paymentFormat';
import { copyToClipboard } from '@/utils/shareUtils';

const METHOD_ICONS: Record<
  PaymentMethodType,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  pago_movil: Smartphone,
  transferencia: Landmark,
  binance: Wallet,
  zelle: CreditCard,
  otro: CreditCard,
};

export default function PaymentTemplatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    currency?: string;
  }>();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { snapshot } = useEffectiveRates();

  const {
    templates,
    addTemplate,
    toggleFavorite,
    deleteTemplate,
  } = usePaymentTemplatesStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentTemplate | null>(null);

  const parsedParamAmount = params.amount ? parseFormattedNumber(params.amount) : 0;
  const paramCurrency: CurrencyCode =
    params.currency === 'USD' ||
    params.currency === 'EUR' ||
    params.currency === 'USDT' ||
    params.currency === 'VES'
      ? params.currency
      : 'USD';

  const handleQuickCopy = (item: PaymentTemplate) => {
    triggerImpactHaptic('medium');
    const message = buildPaymentShareMessage({
      template: item,
      amount: parsedParamAmount > 0 ? parsedParamAmount : 0,
      currency: paramCurrency,
      rateSource: getDefaultRateSourceForCurrency(paramCurrency),
      snapshot,
      includeEquivalents: true,
    });
    void copyToClipboard(message, `Datos de "${item.alias}" copiados`);
  };

  const sorted = [...templates].sort((a, b) => {
    if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) {
      return a.isFavorite ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const openDetail = (templateId: string) => {
    triggerSelectionHaptic();
    router.push({
      pathname: '/tools/payments/[id]',
      params: {
        id: templateId,
        ...(params.amount ? { amount: params.amount } : {}),
        ...(params.currency ? { currency: params.currency } : {}),
      },
    });
  };

  return (
    <View
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      <ScreenHero
        title="Plantillas de pago"
        subtitle={
          params.amount
            ? `Elige una plantilla para enviar ${params.amount} ${params.currency ?? ''}`
            : 'Pago Móvil, transferencias, Binance Pay y Zelle'
        }
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
            onPress={() => {
              triggerSelectionHaptic();
              setSheetVisible(true);
            }}
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
        {sorted.length === 0 ? (
          <Card className="items-center py-10">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${COLORS.primary}1A`,
                borderCurve: 'continuous',
              }}
            >
              <CreditCard size={30} color={COLORS.primary} />
            </View>
            <Text className="text-center text-base font-semibold text-text-primary">
              Aún no tienes plantillas guardadas
            </Text>
            <Text className="mt-1.5 max-w-[275px] text-center text-xs leading-5 text-text-secondary">
              Guarda tus cuentas de Pago Móvil, transferencia, Binance Pay o Zelle para copiar y enviar con el monto exacto en cualquier moneda.
            </Text>
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                setSheetVisible(true);
              }}
              className="mt-5 flex-row items-center gap-2 rounded-2xl px-6 py-3 active:opacity-85"
              style={{
                backgroundColor: COLORS.primary,
                borderCurve: 'continuous',
              }}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-sm font-medium text-white">
                Crear primera plantilla
              </Text>
            </Pressable>
          </Card>
        ) : (
          sorted.map((item, idx) => {
            const Icon = METHOD_ICONS[item.type];
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(idx * 45).duration(280)}
              >
                <Pressable
                  onPress={() => openDetail(item.id)}
                  onLongPress={() => handleQuickCopy(item)}
                  delayLongPress={350}
                  className="active:opacity-85"
                >
                  <Card className="border border-border">
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1 flex-row items-center gap-3">
                        <View
                          className="h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${COLORS.primary}1A`,
                            borderCurve: 'continuous',
                          }}
                        >
                          <Icon size={18} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className="flex-shrink text-base font-semibold text-text-primary"
                              numberOfLines={1}
                            >
                              {item.alias}
                            </Text>
                            <View
                              className="rounded-full px-2 py-0.5"
                              style={{ backgroundColor: COLORS.surfaceElevated }}
                            >
                              <Text className="text-[10px] font-medium text-text-secondary">
                                {PAYMENT_METHOD_LABELS[item.type]}
                              </Text>
                            </View>
                          </View>
                          <Text
                            className="mt-0.5 text-xs text-text-muted"
                            numberOfLines={1}
                          >
                            {getTemplateSummary(item)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Pressable
                          onPress={() => {
                            triggerSelectionHaptic();
                            toggleFavorite(item.id);
                          }}
                          hitSlop={8}
                          className="rounded-lg bg-surface-elevated p-1.5 active:opacity-75"
                        >
                          <Star
                            size={14}
                            color={
                              item.isFavorite ? COLORS.primary : COLORS.textMuted
                            }
                            fill={item.isFavorite ? COLORS.primary : 'none'}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            triggerSelectionHaptic();
                            setDeleteTarget(item);
                          }}
                          hitSlop={8}
                          className="rounded-lg bg-danger/10 p-1.5 active:opacity-75"
                        >
                          <Trash2 size={14} color={COLORS.danger} />
                        </Pressable>
                      </View>
                    </View>

                    <View className="mt-2.5 flex-row items-center justify-between gap-2">
                      <Text className="text-xs text-text-muted">
                        Mantén presionado para copiar
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text
                          className="text-xs font-medium"
                          style={{ color: COLORS.primary }}
                        >
                          {params.amount
                            ? 'Usar con este monto'
                            : 'Copiar o incluir monto'}
                        </Text>
                        <ArrowRight size={13} color={COLORS.primary} />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <PaymentTemplateSheet
        visible={sheetVisible}
        onSave={(input) => {
          const newId = addTemplate(input);
          if (params.amount) {
            openDetail(newId);
          }
        }}
        onClose={() => setSheetVisible(false)}
      />

      <AppModal
        visible={deleteTarget !== null}
        title="Eliminar plantilla"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.alias ?? ''}"?`}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (deleteTarget) {
            deleteTemplate(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}
