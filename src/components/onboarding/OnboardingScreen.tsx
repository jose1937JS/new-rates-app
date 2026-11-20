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
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

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
  const isDark = COLORS.isDark;

  // Harmonized studio gradient matching the 3D orange + dark slate illustrations
  const gradientTop = isDark ? '#1e242c' : '#ffffff';
  const gradientMid = isDark ? '#14181f' : '#fff8f3';
  const gradientBottom = isDark ? '#0c0f14' : '#fae8dc';
  const accentColor = isDark ? '#e85d1a' : '#ff6b26';
  const brandTextColor = isDark ? '#f8fafc' : '#14181f';
  const skipBg = isDark
    ? 'rgba(255, 255, 255, 0.09)'
    : 'rgba(20, 24, 31, 0.06)';
  const skipTextColor = isDark ? '#cbd5e1' : '#4b5563';
  const inactiveDotColor = isDark
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(20, 24, 31, 0.16)';

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
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Full-bleed edge-to-edge studio gradient + soft radial orange backlight behind 3D art */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="onboardingStudioBg" x1="0" y1="0" x2="0.2" y2="1">
              <Stop offset="0%" stopColor={gradientTop} />
              <Stop offset="50%" stopColor={gradientMid} />
              <Stop offset="100%" stopColor={gradientBottom} />
            </LinearGradient>
            <RadialGradient
              id="onboardingSpotlight"
              cx="50%"
              cy="34%"
              rx="52%"
              ry="32%"
            >
              <Stop
                offset="0%"
                stopColor="#ff6b26"
                stopOpacity={isDark ? 0.26 : 0.14}
              />
              <Stop
                offset="58%"
                stopColor="#ff8c4f"
                stopOpacity={isDark ? 0.08 : 0.05}
              />
              <Stop offset="100%" stopColor="#ff6b26" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#onboardingStudioBg)"
          />
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#onboardingSpotlight)"
          />
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
            style={{ width: 38, height: 38, marginTop: 2 }}
            resizeMode="contain"
          />
          <Text
            className="text-lg font-bold tracking-wide"
            style={{ color: brandTextColor }}
          >
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
            backgroundColor: skipBg,
          }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: skipTextColor }}
          >
            Saltar
          </Text>
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

      {/* Bottom progress indicators + vibrant primary CTA */}
      <View
        className="gap-5 px-7 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 14 }}
      >
        <OnboardingDots
          count={TOTAL_STEPS}
          scrollOffset={scrollOffset}
          activeColor={accentColor}
          inactiveColor={inactiveDotColor}
        />

        <AnimatedPressable
          onPress={handlePrimaryAction}
          onPressIn={() => ctaScale.set(withTiming(0.97, { duration: 90 }))}
          onPressOut={() => ctaScale.set(withTiming(1, { duration: 120 }))}
          accessibilityRole="button"
          accessibilityLabel={
            isLastStep ? 'Entrar a la aplicación' : 'Siguiente paso'
          }
          className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
          style={[
            ctaAnimatedStyle,
            {
              backgroundColor: accentColor,
              borderCurve: 'continuous',
              shadowColor: '#ff6b26',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.34 : 0.28,
              shadowRadius: 14,
              elevation: 5,
            },
          ]}
        >
          <Text className="text-base font-bold text-white">
            {isLastStep ? 'Entrar' : 'Siguiente'}
          </Text>
          <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}
