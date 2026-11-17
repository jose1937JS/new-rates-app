import { useEffect } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SkeletonBlockProps {
  pulse: SharedValue<number>;
  backgroundColor: string;
  className?: string;
  style?: ViewStyle;
}

function SkeletonBlock({
  pulse,
  backgroundColor,
  className,
  style,
}: SkeletonBlockProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.get(),
  }));

  return (
    <Animated.View
      className={className}
      style={[{ backgroundColor }, style, animatedStyle]}
    />
  );
}

export function ConverterSkeleton() {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(0.4, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
      ),
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const blockBg = COLORS.surfaceElevated;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando tasas de cambio"
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      {/* Full-width Hero skeleton */}
      <View
        style={{
          backgroundColor: COLORS.surfaceCard,
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 80,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          borderBottomWidth: 1,
          borderColor: COLORS.border,
          borderCurve: 'continuous',
        }}
      >
        {/* Header row skeleton */}
        <View className="mb-4 flex-row items-center justify-between">
          <SkeletonBlock
            pulse={pulse}
            backgroundColor={blockBg}
            className="mb-2 h-8 w-44 rounded-xl"
          />
          <SkeletonBlock
            pulse={pulse}
            backgroundColor={blockBg}
            className="h-6 w-20 rounded-full"
          />
        </View>

        {/* 3 quick-verification hero card skeletons */}
        <View className="flex-row gap-2.5">
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              className="flex-1 rounded-2xl border p-3"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                borderCurve: 'continuous',
              }}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <SkeletonBlock
                    pulse={pulse}
                    backgroundColor={blockBg}
                    className="h-3.5 w-3.5 rounded-full"
                  />
                  <SkeletonBlock
                    pulse={pulse}
                    backgroundColor={blockBg}
                    className="h-3 w-8 rounded"
                  />
                </View>
                <SkeletonBlock
                  pulse={pulse}
                  backgroundColor={blockBg}
                  className="h-2.5 w-6 rounded"
                />
              </View>
              <SkeletonBlock
                pulse={pulse}
                backgroundColor={blockBg}
                className="mb-1.5 h-4 w-16 rounded-md"
              />
              <View className="flex-row items-center justify-between">
                <SkeletonBlock
                  pulse={pulse}
                  backgroundColor={blockBg}
                  className="h-3 w-10 rounded"
                />
                <SkeletonBlock
                  pulse={pulse}
                  backgroundColor={blockBg}
                  className="h-3 w-3 rounded-full"
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Body skeleton overlapping hero */}
      <ScrollView
        className="flex-1 -mt-20"
        scrollEnabled={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 0,
          paddingBottom: 104 + insets.bottom,
          gap: 16,
        }}
      >
        {/* Active CurrencyInput skeleton */}
        <Card
          className="border-2"
          style={{
            borderColor: COLORS.border,
          }}
        >
          <View className="mb-3 flex-row items-center gap-2">
            <SkeletonBlock
              pulse={pulse}
              backgroundColor={blockBg}
              className="h-6 w-6 rounded-full"
            />
            <SkeletonBlock
              pulse={pulse}
              backgroundColor={blockBg}
              className="h-4 w-36 rounded-md"
            />
          </View>
          <View
            className="flex-row items-center gap-2.5"
            style={{ height: 52 }}
          >
            <SkeletonBlock
              pulse={pulse}
              backgroundColor={blockBg}
              className="h-7 w-7 rounded-lg"
            />
            <SkeletonBlock
              pulse={pulse}
              backgroundColor={blockBg}
              className="h-9 w-36 rounded-lg"
            />
          </View>
        </Card>

        {/* Section header skeleton */}
        <View className="flex-row items-center justify-between">
          <SkeletonBlock
            pulse={pulse}
            backgroundColor={blockBg}
            className="h-5 w-28 rounded-md"
          />
          <SkeletonBlock
            pulse={pulse}
            backgroundColor={blockBg}
            className="h-3.5 w-32 rounded-md"
          />
        </View>

        {/* 3 RateCard skeletons (VES + 2 foreign currencies) */}
        <View className="gap-3">
          {[false, true, true].map((hasRateMeta, index) => (
            <View
              key={index}
              className="rounded-2xl border bg-surface-card p-4"
              style={{
                borderColor: COLORS.border,
                borderCurve: 'continuous',
              }}
            >
              <View className="mb-2.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <SkeletonBlock
                    pulse={pulse}
                    backgroundColor={blockBg}
                    className="h-5 w-5 rounded-full"
                  />
                  <SkeletonBlock
                    pulse={pulse}
                    backgroundColor={blockBg}
                    className="h-5 w-12 rounded-md"
                  />
                  <SkeletonBlock
                    pulse={pulse}
                    backgroundColor={blockBg}
                    className="h-3.5 w-24 rounded-md"
                  />
                </View>
                {hasRateMeta && (
                  <SkeletonBlock
                    pulse={pulse}
                    backgroundColor={blockBg}
                    className="h-5 w-14 rounded-full"
                  />
                )}
              </View>

              <SkeletonBlock
                pulse={pulse}
                backgroundColor={blockBg}
                className="mb-1.5 h-7 w-40 rounded-lg"
              />

              {hasRateMeta && (
                <SkeletonBlock
                  pulse={pulse}
                  backgroundColor={blockBg}
                  className="h-3.5 w-32 rounded-md"
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
