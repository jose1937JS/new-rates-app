import * as Haptics from 'expo-haptics';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';

interface EmptyStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
  isError?: boolean;
}

export function EmptyState({ title, message, onRetry, isRetrying = false, isError = false }: EmptyStateProps) {
  const COLORS = useThemeColors();
  const accent = isError ? COLORS.danger : COLORS.primary;

  const float = useSharedValue(0);
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(float);
      cancelAnimation(pulse);
    };
  }, [float, pulse]);

  useEffect(() => {
    if (isRetrying) {
      rotation.value = 0;
      rotation.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [isRetrying, rotation]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2.2 - pulse.value * 1.6,
  }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  const handlePress = () => {
    if (isRetrying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry();
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(450)}
      className="items-center rounded-3xl px-6 py-10"
      style={{
        backgroundColor: COLORS.surfaceCard,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderCurve: 'continuous',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      <View className="mb-6 h-28 w-28 items-center justify-center">
        <Animated.View
          className="absolute h-28 w-28 rounded-full"
          style={[{ backgroundColor: accent + '22' }, haloStyle]}
        />
        <Animated.View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={[{ backgroundColor: accent + '1A', borderWidth: 1, borderColor: accent + '40' }, iconStyle]}
        >
          <CloudOff size={36} color={accent} strokeWidth={1.8} />
        </Animated.View>
      </View>

      <Text className="text-center text-xl font-bold" style={{ color: COLORS.textPrimary }}>
        {title}
      </Text>
      <Text
        className="mt-2 text-center text-sm leading-5"
        style={{ color: COLORS.textSecondary, maxWidth: 280 }}
      >
        {message}
      </Text>

      <Animated.View style={[buttonStyle, { marginTop: 28 }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => (pressScale.value = withSpring(0.95, { damping: 15, stiffness: 400 }))}
          onPressOut={() => (pressScale.value = withSpring(1, { damping: 12, stiffness: 300 }))}
          disabled={isRetrying}
          accessibilityRole="button"
          accessibilityLabel="Reintentar obtener datos"
          accessibilityState={{ busy: isRetrying }}
          className="flex-row items-center gap-2 rounded-2xl px-7 py-3.5"
          style={{
            backgroundColor: COLORS.primary,
            opacity: isRetrying ? 0.85 : 1,
            borderCurve: 'continuous',
            boxShadow: `0 6px 16px ${COLORS.primary}55`,
          }}
        >
          <Animated.View style={spinStyle}>
            <RefreshCw size={18} color="#fff" strokeWidth={2.4} />
          </Animated.View>
          <Text className="text-base font-semibold text-white">
            {isRetrying ? 'Reintentando...' : 'Reintentar'}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
