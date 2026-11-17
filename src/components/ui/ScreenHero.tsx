import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';

interface ScreenHeroProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  rightElement?: ReactNode;
  children?: ReactNode;
}

export function ScreenHero({
  title,
  subtitle,
  icon,
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
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderCurve: 'continuous',
            }}
          >
            {icon}
          </View>
          <View>
            <Text className="text-xl font-bold text-white">{title}</Text>
            {subtitle ? (
              <Text className="text-xs text-white/80">{subtitle}</Text>
            ) : null}
          </View>
        </View>
        {rightElement}
      </View>

      {children ? <View className="mt-4">{children}</View> : null}
    </Animated.View>
  );
}
