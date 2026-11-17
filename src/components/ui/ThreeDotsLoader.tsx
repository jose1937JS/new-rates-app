import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';

export interface ThreeDotsLoaderProps {
  /** Diameter of each dot in px (default: 8) */
  size?: number;
  /** Single color applied to all 3 dots (defaults to theme primary) */
  color?: string;
  /** Optional per-dot colors [dot1, dot2, dot3]; overrides `color` when provided */
  colors?: [string, string, string];
  /** Horizontal spacing between dots in px */
  gap?: number;
}

interface AnimatedDotProps {
  index: number;
  size: number;
  color: string;
  bounce: number;
}

function AnimatedDot({ index, size, color, bounce }: AnimatedDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        index * 140,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: 280,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(0, {
              duration: 280,
              easing: Easing.in(Easing.cubic),
            }),
            withTiming(0, { duration: 240 }),
          ),
          -1,
        ),
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: 0.4 + p * 0.6,
      transform: [{ translateY: -p * bounce }, { scale: 0.85 + p * 0.25 }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ThreeDotsLoader({
  size = 8,
  color,
  colors,
  gap,
}: ThreeDotsLoaderProps) {
  const COLORS = useThemeColors();
  const baseColor = color ?? COLORS.primary;
  const dotColors: [string, string, string] = colors ?? [
    baseColor,
    baseColor,
    baseColor,
  ];
  const resolvedGap = gap ?? Math.max(4, Math.round(size * 0.65));
  const bounce = Math.max(3, Math.round(size * 0.55));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
      className="flex-row items-end justify-center"
      style={{
        gap: resolvedGap,
        height: size + bounce + 2,
        paddingBottom: 1,
      }}
    >
      {dotColors.map((dotColor, index) => (
        <AnimatedDot
          key={index}
          index={index}
          size={size}
          color={dotColor}
          bounce={bounce}
        />
      ))}
    </View>
  );
}
