import type { ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';

const APP_LOGO = require('@/assets/images/logo.png');

interface ScreenHeroProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  leftAction?: ReactNode;
  showLogo?: boolean;
  rightElement?: ReactNode;
  children?: ReactNode;
}

export function ScreenHero({
  title,
  subtitle,
  icon,
  leftAction,
  showLogo = false,
  rightElement,
  children,
}: ScreenHeroProps) {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={{
        backgroundColor: COLORS.primary,
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 18,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        borderCurve: 'continuous',
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-3">
          {leftAction ? (
            leftAction
          ) : icon ? (
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderCurve: 'continuous',
              }}
            >
              {icon}
            </View>
          ) : null}

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              {showLogo && (
                <Image
                  source={APP_LOGO}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              )}
              <Text
                className="flex-1 text-xl font-bold text-white"
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
            {subtitle ? (
              <Text className="text-xs text-white/80" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightElement}
      </View>

      {children ? <View className="mt-4">{children}</View> : null}
    </Animated.View>
  );
}
