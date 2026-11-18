import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { OnboardingDots } from '@/components/onboarding/OnboardingDots';
import {
  OnboardingPager,
  type OnboardingPagerHandle,
} from '@/components/onboarding/OnboardingPager';
import {
  OfflineAccessSlide,
  PersonalizationHistorySlide,
  RealtimeRatesSlide,
} from '@/components/onboarding/OnboardingSlides';
import { useThemeColors } from '@/hooks/useThemeColors';

const APP_LOGO = require('@/assets/images/logo.png');
const TOTAL_STEPS = 3;
const LAST_STEP_INDEX = TOTAL_STEPS - 1;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<OnboardingPagerHandle>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const scrollOffset = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  const isLastStep = currentPage === LAST_STEP_INDEX;

  const gradientTop = COLORS.isDark ? '#e06024' : '#ff8c4f';
  const gradientMid = COLORS.isDark ? '#b84514' : '#ff6b26';
  const gradientBottom = COLORS.isDark ? '#7d2907' : '#cc440e';
  const ctaTextColor = COLORS.isDark ? '#b84514' : '#ff6b26';

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.get() }],
  }));

  const handlePageChange = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
  }, []);

  const handleSkip = useCallback(() => {
    void Haptics.selectionAsync();
    pagerRef.current?.setPage(LAST_STEP_INDEX);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (isLastStep) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } else {
      void Haptics.selectionAsync();
      pagerRef.current?.setPage(currentPage + 1);
    }
  }, [currentPage, isLastStep, onComplete]);

  const pages = useMemo(
    () => [
      <RealtimeRatesSlide key="realtime" isActive={currentPage === 0} />,
      <OfflineAccessSlide key="offline" isActive={currentPage === 1} />,
      <PersonalizationHistorySlide key="themes" isActive={currentPage === 2} />,
    ],
    [currentPage],
  );

  return (
    <Animated.View entering={FadeIn.duration(280)} className="flex-1">
      <StatusBar style="light" />

      {/* Full-bleed edge-to-edge orange gradient from status bar to navigation bar */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="onboardingBg" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0%" stopColor={gradientTop} />
              <Stop offset="48%" stopColor={gradientMid} />
              <Stop offset="100%" stopColor={gradientBottom} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#onboardingBg)" />
        </Svg>
      </View>

      {/* Top brand bar */}
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 14, paddingBottom: 6 }}
      >
        <View className="flex-row items-center gap-2.5">
          <Image
            source={APP_LOGO}
            style={{ width: 42, height: 42, marginTop: 2 }}
            resizeMode="contain"
          />
          <Text className="text-xl font-bold tracking-wide text-white">
            RATES VENAPP
          </Text>
        </View>

        <Pressable
          onPress={handleSkip}
          disabled={isLastStep}
          accessibilityRole="button"
          accessibilityLabel="Saltar introducción"
          className="rounded-full px-3.5 py-1.5 active:opacity-70"
          style={{
            opacity: isLastStep ? 0 : 1,
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
          }}
        >
          <Text className="text-xs font-semibold text-white">Saltar</Text>
        </Pressable>
      </View>

      {/* Horizontal swipeable PagerView */}
      <View className="flex-1">
        <OnboardingPager
          ref={pagerRef}
          pages={pages}
          scrollOffset={scrollOffset}
          onPageChange={handlePageChange}
        />
      </View>

      {/* Bottom progress indicators + high-contrast white CTA button */}
      <View
        className="gap-5 px-7 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 14 }}
      >
        <OnboardingDots
          count={TOTAL_STEPS}
          scrollOffset={scrollOffset}
          color="#ffffff"
        />

        <AnimatedPressable
          onPress={handlePrimaryAction}
          onPressIn={() => ctaScale.set(withTiming(0.97, { duration: 90 }))}
          onPressOut={() => ctaScale.set(withTiming(1, { duration: 120 }))}
          accessibilityRole="button"
          accessibilityLabel={
            isLastStep ? 'Entrar a la aplicación' : 'Siguiente paso'
          }
          className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-white shadow-md"
          style={[
            ctaAnimatedStyle,
            {
              borderCurve: 'continuous',
            },
          ]}
        >
          <Text
            className="text-base font-bold"
            style={{ color: ctaTextColor }}
          >
            {isLastStep ? 'Entrar' : 'Siguiente'}
          </Text>
          <ArrowRight size={18} color={ctaTextColor} strokeWidth={2.5} />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}
