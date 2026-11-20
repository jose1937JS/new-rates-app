import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

interface OnboardingDotsProps {
  count: number;
  scrollOffset: SharedValue<number>;
  activeColor?: string;
  inactiveColor?: string;
}

interface AnimatedDotProps {
  index: number;
  scrollOffset: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}

function AnimatedProgressDot({
  index,
  scrollOffset,
  activeColor,
  inactiveColor,
}: AnimatedDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = scrollOffset.get();
    const width = interpolate(
      progress,
      [index - 1, index, index + 1],
      [8, 30, 8],
      Extrapolation.CLAMP,
    );
    const backgroundColor = interpolateColor(
      progress,
      [index - 1, index, index + 1],
      [inactiveColor, activeColor, inactiveColor],
    );

    return {
      width,
      backgroundColor,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

export function OnboardingDots({
  count,
  scrollOffset,
  activeColor = '#ff6b26',
  inactiveColor = 'rgba(255, 107, 38, 0.24)',
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
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}
