import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { APP_NAME, DEFAULT_PRIMARY_COLOR } from '@/utils/constants';

const APP_LOGO = require('@/assets/images/logo.png');

interface AnimatedSplashOverlayProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplashOverlay({
  isReady,
  onFinish,
}: AnimatedSplashOverlayProps) {
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
    width: `${Math.round(barProgress.get() * 100)}%`,
  }));

  return (
    <Animated.View
      pointerEvents={isClosing ? 'none' : 'auto'}
      className="absolute inset-0 z-50 items-center justify-center px-8"
      style={[containerStyle, { backgroundColor: DEFAULT_PRIMARY_COLOR }]}
    >
      <Animated.View style={logoStyle} className="items-center">
        <View
          className="mb-5 h-32 w-32 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
        >
          <Image
            source={APP_LOGO}
            style={{ width: 108, height: 108 }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      <Text className="text-3xl font-bold tracking-wide text-white">
        {APP_NAME}
      </Text>
      <Text className="mt-1 text-xs font-medium text-white/85">
        Tasas de cambio al instante
      </Text>

      <View className="mt-8 w-44 items-center gap-3">
        <View
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
        >
          <Animated.View
            className="h-full rounded-full bg-white"
            style={progressStyle}
          />
        </View>
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#ffffff" />
          <Text className="text-xs font-medium text-white/90">
            Cargando tasas...
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
