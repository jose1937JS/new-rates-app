import * as Haptics from 'expo-haptics';
import { ArrowDown } from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThreeDotsLoader } from '@/components/ui/ThreeDotsLoader';
import { useThemeColors } from '@/hooks/useThemeColors';

/** Minimum downward finger travel (px) before the pull even begins moving */
const PULL_DEAD_ZONE = 200;
/** Total downward finger travel (px) required to trigger a refresh */
const PULL_TRIGGER_DISTANCE = 380;
/** Max visual downward shift (px) applied to the content while pulling */
const MAX_VISUAL_OFFSET = 88;
/** Visual height (px) reserved while the refresh request is running */
const REFRESHING_OFFSET = 72;
const EFFECTIVE_TRIGGER_RANGE = PULL_TRIGGER_DISTANCE - PULL_DEAD_ZONE;

export interface PullToRefreshScrollViewProps
  extends Omit<ScrollViewProps, 'refreshControl'> {
  refreshing: boolean;
  onRefresh: () => void | Promise<unknown>;
  children: ReactNode;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function PullToRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  containerClassName,
  containerStyle,
  contentContainerStyle,
  ...scrollViewProps
}: PullToRefreshScrollViewProps) {
  const COLORS = useThemeColors();
  const [isReady, setIsReady] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const isBusy = refreshing || isTriggering;

  const scrollY = useSharedValue(0);
  const startedAtTop = useSharedValue(false);
  const pullOffset = useSharedValue(0);
  const pullProgress = useSharedValue(0);
  const readyReached = useSharedValue(false);
  const isBusyShared = useSharedValue(false);

  useEffect(() => {
    isBusyShared.set(isBusy);
    if (isBusy) {
      pullOffset.set(
        withTiming(REFRESHING_OFFSET, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        }),
      );
      pullProgress.set(1);
    } else {
      pullOffset.set(
        withTiming(0, {
          duration: 240,
          easing: Easing.out(Easing.cubic),
        }),
      );
      pullProgress.set(withTiming(0, { duration: 180 }));
      readyReached.set(false);
      setIsReady(false);
    }
  }, [isBusy, isBusyShared, pullOffset, pullProgress, readyReached]);

  const notifyReadyChange = useCallback((ready: boolean) => {
    setIsReady(ready);
    if (ready) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    setIsTriggering(true);
    void Promise.resolve(onRefresh()).finally(() => {
      setIsTriggering(false);
    });
  }, [onRefresh]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(event.contentOffset.y);
    },
  });

  const composedGesture = useMemo(() => {
    const nativeGesture = Gesture.Native();

    const panGesture = Gesture.Pan()
      .activeOffsetY(48)
      .failOffsetY(-10)
      .failOffsetX([-24, 24])
      .onBegin(() => {
        startedAtTop.set(scrollY.get() <= 1 && !isBusyShared.get());
        readyReached.set(false);
      })
      .onUpdate((event) => {
        if (!startedAtTop.get() || isBusyShared.get()) return;

        if (scrollY.get() > 1 || event.translationY <= PULL_DEAD_ZONE) {
          if (pullOffset.get() !== 0) {
            pullOffset.set(0);
            pullProgress.set(0);
          }
          if (readyReached.get()) {
            readyReached.set(false);
            runOnJS(notifyReadyChange)(false);
          }
          return;
        }

        const effectivePull = event.translationY - PULL_DEAD_ZONE;
        const progress = Math.min(1, effectivePull / EFFECTIVE_TRIGGER_RANGE);
        const visualOffset = Math.min(
          MAX_VISUAL_OFFSET,
          Math.pow(effectivePull, 0.72) * 1.65,
        );

        pullOffset.set(visualOffset);
        pullProgress.set(progress);

        const nowReady = progress >= 1;
        if (nowReady !== readyReached.get()) {
          readyReached.set(nowReady);
          runOnJS(notifyReadyChange)(nowReady);
        }
      })
      .onEnd(() => {
        if (!startedAtTop.get() || isBusyShared.get()) return;

        if (readyReached.get()) {
          isBusyShared.set(true);
          pullOffset.set(
            withTiming(REFRESHING_OFFSET, {
              duration: 180,
              easing: Easing.out(Easing.cubic),
            }),
          );
          runOnJS(triggerRefresh)();
        } else {
          pullOffset.set(
            withSpring(0, {
              damping: 20,
              stiffness: 260,
            }),
          );
          pullProgress.set(withTiming(0, { duration: 180 }));
        }
      })
      .onFinalize(() => {
        startedAtTop.set(false);
        if (!isBusyShared.get()) {
          if (readyReached.get()) {
            readyReached.set(false);
            runOnJS(notifyReadyChange)(false);
          }
          if (pullOffset.get() > 0) {
            pullOffset.set(
              withSpring(0, {
                damping: 20,
                stiffness: 260,
              }),
            );
            pullProgress.set(withTiming(0, { duration: 180 }));
          }
        }
      });

    return Gesture.Simultaneous(panGesture, nativeGesture);
  }, [
    isBusyShared,
    notifyReadyChange,
    pullOffset,
    pullProgress,
    readyReached,
    scrollY,
    startedAtTop,
    triggerRefresh,
  ]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pullOffset.get() }],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const offset = pullOffset.get();
    const opacity = interpolate(offset, [8, 30], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(offset, [8, 56], [0.88, 1], Extrapolation.CLAMP);
    const translateY = interpolate(
      offset,
      [0, MAX_VISUAL_OFFSET],
      [-16, 12],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const arrowAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      pullProgress.get(),
      [0.75, 1],
      [0, 180],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${Math.round(pullProgress.get() * 100)}%`,
  }));

  return (
    <View className={containerClassName ?? 'flex-1'} style={containerStyle}>
      {/* Floating pull-to-refresh indicator revealed when pulling down */}
      <Animated.View
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 z-10 items-center"
        style={indicatorAnimatedStyle}
      >
        <View
          className="flex-row items-center gap-2 rounded-full border px-3.5 py-2"
          style={{
            backgroundColor: COLORS.surfaceCard,
            borderColor: isReady || isBusy ? COLORS.primary : COLORS.border,
          }}
        >
          {isBusy ? (
            <>
              <ThreeDotsLoader size={6} color={COLORS.primary} />
              <Text className="text-xs font-medium text-text-secondary">
                Actualizando tasas...
              </Text>
            </>
          ) : (
            <>
              <Animated.View style={arrowAnimatedStyle}>
                <ArrowDown
                  size={14}
                  color={isReady ? COLORS.primary : COLORS.textMuted}
                />
              </Animated.View>
              <View className="gap-1">
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: isReady ? COLORS.primary : COLORS.textSecondary,
                  }}
                >
                  {isReady ? 'Suelta para actualizar' : 'Desliza más para actualizar'}
                </Text>
                <View
                  className="h-1 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: COLORS.surfaceElevated }}
                >
                  <Animated.View
                    className="h-full rounded-full"
                    style={[
                      { backgroundColor: COLORS.primary },
                      progressBarAnimatedStyle,
                    ]}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.ScrollView
          {...scrollViewProps}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          style={[scrollViewProps.style, contentAnimatedStyle]}
          contentContainerStyle={contentContainerStyle}
        >
          {children}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}
