import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Calculator,
  CreditCard,
  LayoutGrid,
  Share2,
  SlidersHorizontal,
  Users,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBillSplitStore } from '@/store/billSplitStore';
import { useCustomRateStore } from '@/store/customRateStore';
import { usePaymentTemplatesStore } from '@/store/paymentTemplatesStore';
import { triggerSelectionHaptic } from '@/utils/haptics';

interface ToolCardItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  route:
    | '/tools/custom-rate'
    | '/tools/mixed-payment'
    | '/tools/payments'
    | '/tools/split'
    | '/tools/share-rates';
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export default function ToolsScreen() {
  const router = useRouter();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();

  const customRates = useCustomRateStore((state) => state.customRates);
  const templates = usePaymentTemplatesStore((state) => state.templates);
  const splits = useBillSplitStore((state) => state.splits);
  const activeCustomCount = customRates.filter((r) => r.enabled).length;

  const gridTools: ToolCardItem[] = [
    {
      id: 'custom-rate',
      title: 'Tasas personalizadas',
      description: 'Crea tasas propias para comercios, puntos o redondeos.',
      badge:
        activeCustomCount > 0
          ? `${activeCustomCount} ${activeCustomCount === 1 ? 'activa' : 'activas'}`
          : customRates.length > 0
            ? `${customRates.length} guardadas`
            : 'Nueva',
      route: '/tools/custom-rate',
      icon: SlidersHorizontal,
    },
    {
      id: 'mixed-payment',
      title: 'Pago mixto + IGTF',
      description: 'Divisas en efectivo y saldo exacto restante en Bolívares.',
      badge: 'IGTF 3%',
      route: '/tools/mixed-payment',
      icon: Calculator,
    },
    {
      id: 'payments',
      title: 'Plantillas de pago',
      description: 'Guarda Pago Móvil, Binance, Zelle y copia montos sin errores.',
      badge:
        templates.length > 0 ? `${templates.length} guardadas` : 'Copiar 1-tap',
      route: '/tools/payments',
      icon: CreditCard,
    },
    {
      id: 'split',
      title: 'Divisor de cuentas',
      description: 'Reparte facturas entre personas, propina y control de pagos.',
      badge: splits.length > 0 ? `${splits.length} cuentas` : 'Multimoneda',
      route: '/tools/split',
      icon: Users,
    },
  ];

  const openRoute = (route: ToolCardItem['route']) => {
    triggerSelectionHaptic();
    router.push(route);
  };

  return (
    <View
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      <ScreenHero
        title="Herramientas"
        subtitle="Utilidades financieras para el día a día"
        icon={<LayoutGrid size={20} color="#ffffff" />}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 104 + insets.bottom,
          gap: 12,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        <View className="flex-row flex-wrap gap-3">
          {gridTools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Animated.View
                key={tool.id}
                entering={FadeInDown.delay(index * 55).duration(320)}
                style={{ width: '48%' }}
              >
                <Pressable
                  onPress={() => openRoute(tool.route)}
                  className="flex-1 active:opacity-85"
                >
                  <Card className="flex-1 justify-between border border-border">
                    <View>
                      <View className="mb-3 flex-row items-center justify-between">
                        <View
                          className="h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${COLORS.primary}1A`,
                            borderCurve: 'continuous',
                          }}
                        >
                          <IconComponent size={20} color={COLORS.primary} />
                        </View>
                        {tool.badge ? (
                          <View
                            className="rounded-full px-2 py-0.5"
                            style={{ backgroundColor: COLORS.surfaceElevated }}
                          >
                            <Text className="text-[10px] font-semibold text-text-secondary">
                              {tool.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text className="text-sm font-semibold text-text-primary">
                        {tool.title}
                      </Text>
                      <Text className="mt-1 text-xs leading-4 text-text-secondary">
                        {tool.description}
                      </Text>
                    </View>

                    <View className="mt-3 flex-row items-center justify-end gap-1">
                      <Text
                        className="text-xs font-medium"
                        style={{ color: COLORS.primary }}
                      >
                        Abrir
                      </Text>
                      <ArrowRight size={13} color={COLORS.primary} />
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Featured Share Rates card */}
        <Animated.View entering={FadeInDown.delay(240).duration(320)}>
          <Pressable
            onPress={() => openRoute('/tools/share-rates')}
            className="active:opacity-85"
          >
            <Card
              className="border"
              style={{
                borderColor: `${COLORS.primary}40`,
              }}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: COLORS.primary,
                      borderCurve: 'continuous',
                    }}
                  >
                    <Share2 size={20} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-text-primary">
                      Compartir tasas en imagen
                    </Text>
                    <Text className="mt-0.5 text-xs text-text-secondary">
                      Tarjeta visual lista para WhatsApp con monto opcional
                      calculado.
                    </Text>
                  </View>
                </View>
                <ArrowRight size={16} color={COLORS.primary} />
              </View>
            </Card>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
