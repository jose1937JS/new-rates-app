import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

interface OnboardingDotsProps {
  count: number;
  scrollOffset: SharedValue<number>;
  color?: string;
}

interface AnimatedDotProps {
  index: number;
  scrollOffset: SharedValue<number>;
  activeColor: string;
}

function AnimatedProgressDot({
  index,
  scrollOffset,
  activeColor,
}: AnimatedDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = scrollOffset.get();
    const width = interpolate(
      progress,
      [index - 1, index, index + 1],
      [8, 30, 8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress,
      [index - 1, index, index + 1],
      [0.35, 1, 0.35],
      Extrapolation.CLAMP,
    );

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: activeColor,
        },
        animatedStyle,
      ]}
    />
  );
}

export function OnboardingDots({
  count,
  scrollOffset,
  color = '#ffffff',
}: OnboardingDotsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      className="flex-row items-center justify-center gap-2"
    >
      {Array.from({ length: count }).map((_, index) => (
        <AnimatedProgressDot
          key={index}
          index={index}
          scrollOffset={scrollOffset}
          activeColor={color}
        />
      ))}
    </View>
  );
}
