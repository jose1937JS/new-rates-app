import { RatesVenTitle } from '@/components/ui/RatesVenTitle';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const APP_LOGO = require('@/assets/images/logo.webp');
const TRACK_WIDTH = 176;

interface AnimatedSplashOverlayProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplashOverlay({
  isReady,
  onFinish,
}: AnimatedSplashOverlayProps) {
  const COLORS = useThemeColors();
  const [isClosing, setIsClosing] = useState(false);

  const logoScale = useSharedValue(1);
  const barProgress = useSharedValue(0.2);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    logoScale.set(
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );

    barProgress.set(withTiming(0.85, { duration: 700, easing: Easing.out(Easing.cubic) }));

    return () => {
      cancelAnimation(logoScale);
      cancelAnimation(barProgress);
    };
  }, [logoScale, barProgress]);

  useEffect(() => {
    if (!isReady) return;

    const closeTimer = setTimeout(() => {
      setIsClosing(true);
      barProgress.set(withTiming(1, { duration: 180 }));
      overlayOpacity.set(withTiming(0, { duration: 300 }));
    }, 650);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 980);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(finishTimer);
    };
  }, [isReady, barProgress, overlayOpacity, onFinish]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.get(),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.get() }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: Math.round(barProgress.get() * TRACK_WIDTH),
  }));

  return (
    <Animated.View
      pointerEvents={isClosing ? 'none' : 'auto'}
      className="absolute inset-0 z-50 items-center justify-center px-8"
      style={[containerStyle, { backgroundColor: COLORS.primary }]}
    >
      <Animated.View style={logoStyle} className="items-center">
        <View className="mb-5 h-32 w-32 items-center justify-center rounded-full">
          <Image
            source={APP_LOGO}
            style={{ width: 110, height: 110 }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      <RatesVenTitle size="xl" />
      <Text className="mt-1.5 text-xs font-medium text-white/85">
        Tasas de cambio al instante
      </Text>

      <View className="mt-12 items-center gap-3" style={{ width: TRACK_WIDTH }}>
        <View
          style={{
            width: TRACK_WIDTH,
            height: 6,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Animated.View
            style={[
              {
                height: 6,
                borderRadius: 999,
                backgroundColor: '#ffffff',
              },
              progressStyle,
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}
