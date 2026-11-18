import {
  Ban,
  Calendar,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  WifiOff
} from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PRIMARY_COLOR_OPTIONS } from '@/utils/constants';

interface SlideProps {
  isActive: boolean;
}

function useEntranceAnimation(isActive: boolean) {
  const translateY = useSharedValue(isActive ? 0 : 12);
  const opacity = useSharedValue(isActive ? 1 : 0.72);

  useEffect(() => {
    if (isActive) {
      translateY.set(12);
      opacity.set(0.75);
      translateY.set(
        withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
      );
      opacity.set(
        withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [isActive, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));
}

export function RealtimeRatesSlide({ isActive }: SlideProps) {
  const COLORS = useThemeColors();
  const entranceStyle = useEntranceAnimation(isActive);
  const orangeInk = COLORS.isDark ? '#b84514' : '#ff6b26';
  const orangeSecondaryInk = COLORS.isDark ? '#8c3008' : '#cc5520';

  return (
    <Animated.View
      style={entranceStyle}
      className="flex-1 justify-between px-7 pb-16 pt-10"
    >
      {/* Top-right stepped visual chips */}
      <Animated.View
        entering={FadeInDown.duration(360)}
        className="items-end gap-3 pt-4"
      >
        <View
          className="flex-row items-center gap-2.5 rounded-2xl px-4 py-2.5"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.28)',
            borderCurve: 'continuous',
          }}
        >
          <CurrencyIcon currency="USD" size={20} />
          <Text className="text-sm font-bold text-white">USD</Text>
          <Text
            className="text-xs font-medium"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          >
            BCV Oficial
          </Text>
        </View>

        <View
          className="mr-6 flex-row items-center gap-2.5 rounded-2xl px-4 py-2.5"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.28)',
            borderCurve: 'continuous',
          }}
        >
          <CurrencyIcon currency="EUR" size={20} />
          <Text className="text-sm font-bold text-white">EUR</Text>
          <Text
            className="text-xs font-medium"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          >
            BCV Oficial
          </Text>
        </View>

        <View
          className="mr-16 flex-row items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-md"
          style={{
            backgroundColor: '#ffffff',
            borderCurve: 'continuous',
          }}
        >
          <CurrencyIcon currency="USDT" size={20} />
          <Text className="text-sm font-bold" style={{ color: orangeInk }}>
            USDT
          </Text>
          <Text
            className="text-xs font-semibold"
            style={{ color: orangeSecondaryInk }}
          >
            Yadio
          </Text>
        </View>
      </Animated.View>

      {/* Left-aligned large headline */}
      <Animated.View entering={FadeInUp.delay(80).duration(380)}>
        <Text
          className="font-bold text-white"
          style={{ fontSize: 36, lineHeight: 42, letterSpacing: -0.7 }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Todas tus tasas{'\n'}al instante
        </Text>

        <Text
          className="mt-4 text-base font-medium leading-6"
          style={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: 310 }}
        >
          Consulta y convierte entre Dólar BCV, Euro BCV, USDT y Bolívares en un
          solo lugar.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

export function OfflineAccessSlide({ isActive }: SlideProps) {
  const COLORS = useThemeColors();
  const entranceStyle = useEntranceAnimation(isActive);
  const orangeInk = COLORS.isDark ? '#b84514' : '#ff6b26';

  return (
    <Animated.View
      style={entranceStyle}
      className="flex-1 items-center justify-center px-7"
    >
      {/* Centered icon emblem */}
      <Animated.View
        entering={FadeInDown.duration(360)}
        className="mb-8 items-center"
      >
        <View
          className="h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: '#ffffff' }}
        >
          <ShieldCheck size={42} color={orangeInk} strokeWidth={2.2} />
        </View>
      </Animated.View>

      {/* Centered large typography */}
      <Animated.View
        entering={FadeInUp.delay(60).duration(380)}
        className="items-center"
      >
        <Text
          className="text-center font-bold text-white"
          style={{ fontSize: 36, lineHeight: 42, letterSpacing: -0.7 }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Lista incluso{'\n'}sin internet
        </Text>

        <Text
          className="mt-4 text-center text-base font-medium leading-6"
          style={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: 315 }}
        >
          Caché inteligente que conserva tus últimas tasas. 100% gratis, privada
          y sin cuentas.
        </Text>

        {/* Minimal inline trust markers */}
        <View className="mt-7 flex-row flex-wrap items-center justify-center gap-3">
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            <WifiOff size={14} color="#ffffff" />
            <Text className="text-xs font-semibold text-white">Offline</Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            <Ban size={14} color="#ffffff" />
            <Text className="text-xs font-semibold text-white">
              Sin anuncios
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            <Sparkles size={14} color="#ffffff" />
            <Text className="text-xs font-semibold text-white">
              Sin registro
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function PersonalizationHistorySlide({ isActive }: SlideProps) {
  const entranceStyle = useEntranceAnimation(isActive);

  return (
    <Animated.View
      style={entranceStyle}
      className="flex-1 justify-between px-7 pb-16 pt-10"
    >
      {/* Top-left trend line + theme swatches */}
      <Animated.View
        entering={FadeInDown.duration(360)}
        className="items-start gap-4 pt-2"
      >
        <View
          className="rounded-3xl p-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.28)',
            borderCurve: 'continuous',
          }}
        >
          <View className="mb-2 flex-row items-center gap-2">
            <Calendar size={14} color="#ffffff" />
            <Text className="text-xs font-semibold text-white">
              Evolución 1d • 7d • 30d
            </Text>
          </View>
          <Svg width={210} height={64} viewBox="0 0 210 64">
            <Path
              d="M 8 50 C 40 46, 52 24, 86 30 C 118 36, 134 14, 166 18 C 182 20, 194 10, 202 8"
              stroke="#ffffff"
              strokeWidth={3.5}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={86} cy={30} r={4} fill="#ffffff" />
            <Circle cx={166} cy={18} r={4} fill="#ffffff" />
            <Circle cx={202} cy={8} r={5.5} fill="#ffffff" />
          </Svg>
        </View>

        <View className="flex-row items-center gap-2.5">
          <View
            className="flex-row items-center gap-2 rounded-full px-3.5 py-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            <Palette size={14} color="#ffffff" />
            <View className="flex-row items-center gap-1.5">
              {PRIMARY_COLOR_OPTIONS.map((option) => (
                <View
                  key={option.id}
                  className="h-3.5 w-3.5 rounded-full"
                  style={{
                    backgroundColor: option.primary,
                    borderWidth: 1.5,
                    borderColor: '#ffffff',
                  }}
                />
              ))}
            </View>
          </View>

          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
          >
            <Moon size={13} color="#ffffff" />
            <Text className="text-xs font-semibold text-white">Oscuro</Text>
          </View>
        </View>
      </Animated.View>

      {/* Right-aligned & bottom-anchored large typography */}
      <Animated.View
        entering={FadeInUp.delay(80).duration(380)}
        className="items-end"
      >
        <Text
          className="text-right font-bold text-white"
          style={{ fontSize: 36, lineHeight: 42, letterSpacing: -0.7 }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Historial y tema{'\n'}a tu medida
        </Text>

        <Text
          className="mt-4 text-right text-base font-medium leading-6"
          style={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: 300 }}
        >
          Explora gráficas históricas hasta 30 días y personaliza tu color y
          modo oscuro.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
