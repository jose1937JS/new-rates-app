import { Ban, Calendar, Sparkles, WifiOff } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PRIMARY_COLOR_OPTIONS } from '@/utils/constants';

const ONBOARDING_IMG_1 = require('@/assets/images/onboarding-1.png');
const ONBOARDING_IMG_2 = require('@/assets/images/onboarding-2.png');
const ONBOARDING_IMG_3 = require('@/assets/images/onboarding-3.png');

interface SlideProps {
  isActive: boolean;
}

function useSlideTokens() {
  const COLORS = useThemeColors();
  const { width, height } = useWindowDimensions();

  const imageSize = Math.round(Math.min(width - 56, height * 0.36, 290));
  const accent = COLORS.isDark ? '#ff7a3d' : '#ff6b26';
  const titleColor = COLORS.isDark ? '#f8fafc' : '#14181f';
  const bodyColor = COLORS.isDark ? '#9ca3af' : '#4b5563';
  const chipBg = COLORS.isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.85)';
  const chipBorder = COLORS.isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(20, 24, 31, 0.08)';
  const chipText = COLORS.isDark ? '#f1f5f9' : '#1f2937';

  return {
    isDark: COLORS.isDark,
    imageSize,
    accent,
    titleColor,
    bodyColor,
    chipBg,
    chipBorder,
    chipText,
  };
}

function useEntranceAnimation(isActive: boolean) {
  const imageScale = useSharedValue(isActive ? 1 : 0.94);
  const translateY = useSharedValue(isActive ? 0 : 14);
  const opacity = useSharedValue(isActive ? 1 : 0.72);

  useEffect(() => {
    if (isActive) {
      imageScale.set(0.94);
      translateY.set(14);
      opacity.set(0.75);
      imageScale.set(
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
      );
      translateY.set(
        withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
      );
      opacity.set(
        withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [imageScale, isActive, opacity, translateY]);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: imageScale.get() }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  return { imageStyle, textStyle };
}

export function RealtimeRatesSlide({ isActive }: SlideProps) {
  const {
    imageSize,
    accent,
    titleColor,
    bodyColor,
    chipBg,
    chipBorder,
    chipText,
  } = useSlideTokens();
  const { imageStyle, textStyle } = useEntranceAnimation(isActive);

  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-2">
      {/* Hero 3D visual */}
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={imageStyle}
        className="flex-1 items-center justify-center"
      >
        <Image
          source={ONBOARDING_IMG_1}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Left-aligned editorial typography */}
      <Animated.View
        entering={FadeInUp.delay(70).duration(380)}
        style={textStyle}
        className="items-start"
      >
        <Text
          className="font-bold"
          style={{
            color: titleColor,
            fontSize: 38,
            lineHeight: 44,
            letterSpacing: -0.8,
          }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Todas tus tasas{'\n'}
          <Text style={{ color: accent }}>al instante</Text>
        </Text>

        <Text
          className="mt-3.5 text-base font-medium leading-6"
          style={{ color: bodyColor, maxWidth: 315 }}
        >
          Consulta y convierte entre Dólar, Euro, USDT y Bolívares en un solo
          lugar.
        </Text>

        <View className="mt-5 flex-row flex-wrap items-center gap-2">
          {(['USD', 'EUR', 'USDT', 'VES'] as const).map((code) => (
            <View
              key={code}
              className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
              style={{
                backgroundColor: chipBg,
                borderColor: chipBorder,
              }}
            >
              <CurrencyIcon currency={code} size={14} />
              <Text
                className="text-xs font-semibold"
                style={{ color: chipText }}
              >
                {code}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export function OfflineAccessSlide({ isActive }: SlideProps) {
  const {
    imageSize,
    accent,
    titleColor,
    bodyColor,
    chipBg,
    chipBorder,
    chipText,
  } = useSlideTokens();
  const { imageStyle, textStyle } = useEntranceAnimation(isActive);

  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-2">
      {/* Hero 3D visual */}
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={imageStyle}
        className="flex-1 items-center justify-center"
      >
        <Image
          source={ONBOARDING_IMG_2}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Centered typography */}
      <Animated.View
        entering={FadeInUp.delay(70).duration(380)}
        style={textStyle}
        className="items-center"
      >
        <Text
          className="text-center font-bold"
          style={{
            color: titleColor,
            fontSize: 38,
            lineHeight: 44,
            letterSpacing: -0.8,
          }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Lista incluso{'\n'}
          <Text style={{ color: accent }}>sin internet</Text>
        </Text>

        <Text
          className="mt-3.5 text-center text-base font-medium leading-6"
          style={{ color: bodyColor, maxWidth: 320 }}
        >
          Caché inteligente que conserva tus últimas tasas. 100% gratis, privada
          y sin cuentas.
        </Text>

        <View className="mt-5 flex-row flex-wrap items-center justify-center gap-2">
          <View
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{ backgroundColor: chipBg, borderColor: chipBorder }}
          >
            <WifiOff size={13} color={accent} />
            <Text className="text-xs font-semibold" style={{ color: chipText }}>
              Offline
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{ backgroundColor: chipBg, borderColor: chipBorder }}
          >
            <Ban size={13} color={accent} />
            <Text className="text-xs font-semibold" style={{ color: chipText }}>
              Sin anuncios
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{ backgroundColor: chipBg, borderColor: chipBorder }}
          >
            <Sparkles size={13} color={accent} />
            <Text className="text-xs font-semibold" style={{ color: chipText }}>
              Sin registro
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function PersonalizationHistorySlide({ isActive }: SlideProps) {
  const {
    isDark,
    imageSize,
    accent,
    titleColor,
    bodyColor,
    chipBg,
    chipBorder,
    chipText,
  } = useSlideTokens();
  const { imageStyle, textStyle } = useEntranceAnimation(isActive);

  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-2">
      {/* Hero 3D visual */}
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={imageStyle}
        className="flex-1 items-center justify-center"
      >
        <Image
          source={ONBOARDING_IMG_3}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Right-aligned editorial typography */}
      <Animated.View
        entering={FadeInUp.delay(70).duration(380)}
        style={textStyle}
        className="items-end"
      >
        <Text
          className="text-right font-bold"
          style={{
            color: titleColor,
            fontSize: 38,
            lineHeight: 44,
            letterSpacing: -0.8,
          }}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Historial y tema{'\n'}
          <Text style={{ color: accent }}>a tu medida</Text>
        </Text>

        <Text
          className="mt-3.5 text-right text-base font-medium leading-6"
          style={{ color: bodyColor, maxWidth: 310 }}
        >
          Explora gráficas históricas hasta 30 días y personaliza tu color y
          modo oscuro.
        </Text>

        <View className="mt-5 flex-row flex-wrap items-center justify-end gap-2">
          <View
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{ backgroundColor: chipBg, borderColor: chipBorder }}
          >
            <Calendar size={13} color={accent} />
            <Text className="text-xs font-semibold" style={{ color: chipText }}>
              1d • 7d • 30d
            </Text>
          </View>

          <View
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{ backgroundColor: chipBg, borderColor: chipBorder }}
          >
            {PRIMARY_COLOR_OPTIONS.map((option) => (
              <View
                key={option.id}
                className="h-3.5 w-3.5 rounded-full"
                style={{
                  backgroundColor: isDark
                    ? option.primaryDark
                    : option.primary,
                  borderWidth: 1,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.35)'
                    : 'rgba(255, 255, 255, 0.9)',
                }}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
