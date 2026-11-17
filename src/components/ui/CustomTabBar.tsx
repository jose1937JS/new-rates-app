import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import { ArrowLeftRight, Settings, TrendingUp } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useThemeColors';

export type CustomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const BAR_HEIGHT = 60;
const FAB_SIZE = 60;
const CORNER_RADIUS = 24;
const NOTCH_HALF_WIDTH = 85;
const NOTCH_DEPTH = 50;
const TAB_ORDER = ['history', 'index', 'settings'] as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getTabBarPath(width: number, totalHeight: number): string {
  const center = width / 2;
  const leftShoulder = Math.max(CORNER_RADIUS, center - NOTCH_HALF_WIDTH);
  const rightShoulder = Math.min(width - CORNER_RADIUS, center + NOTCH_HALF_WIDTH);

  return [
    `M 0,${CORNER_RADIUS}`,
    `Q 0,0 ${CORNER_RADIUS},0`,
    `L ${leftShoulder},0`,
    `C ${center - 30},0 ${center - 40},${NOTCH_DEPTH} ${center},${NOTCH_DEPTH}`,
    `C ${center + 40},${NOTCH_DEPTH} ${center + 30},0 ${rightShoulder},0`,
    `L ${width - CORNER_RADIUS},0`,
    `Q ${width},0 ${width},${CORNER_RADIUS}`,
    `L ${width},${totalHeight}`,
    `L 0,${totalHeight}`,
    'Z',
  ].join(' ');
}

interface CenterFabButtonProps {
  isFocused: boolean;
  primaryColor: string;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
}

function CenterFabButton({
  isFocused,
  primaryColor,
  accessibilityLabel,
  onPress,
  onLongPress,
}: CenterFabButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = () => {
    scale.set(withTiming(0.9, { duration: 100 }));
  };

  const handlePressOut = () => {
    scale.set(withTiming(1, { duration: 120 }));
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? 'Conversor'}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="absolute -top-[50px] items-center justify-center rounded-full bg-white"
      style={[
        animatedStyle,
        {
          width: FAB_SIZE,
          height: FAB_SIZE,
          shadowColor: '#4a4a4aff',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 5,
          elevation: 5,
        },
      ]}
    >
      <ArrowLeftRight
        size={25}
        color={primaryColor}
        strokeWidth={isFocused ? 2.5 : 2}
      />
    </AnimatedPressable>
  );
}

interface SideTabButtonProps {
  label: string;
  isHistory: boolean;
  isFocused: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
}

function SideTabButton({
  label,
  isHistory,
  isFocused,
  accessibilityLabel,
  onPress,
  onLongPress,
}: SideTabButtonProps) {
  const IconComponent = isHistory ? TrendingUp : Settings;
  const tintColor = isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.74)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center gap-1 py-2 active:opacity-75 mt-5"
    >
      <IconComponent
        size={24}
        color={tintColor}
        strokeWidth={isFocused ? 2.4 : 1.9}
      />
      <Text
        className={`text-xs ${
          isFocused ? 'font-semibold text-white' : 'font-medium'
        }`}
        style={isFocused ? undefined : { color: tintColor }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const bottomInset = insets.bottom;
  const totalHeight = BAR_HEIGHT + bottomInset;
  const path = getTabBarPath(width, totalHeight);

  // Enforce visual order: Left (history) -> Center FAB (index) -> Right (settings)
  const orderedRoutes = [...state.routes].sort((a, b) => {
    const idxA = TAB_ORDER.indexOf(a.name as (typeof TAB_ORDER)[number]);
    const idxB = TAB_ORDER.indexOf(b.name as (typeof TAB_ORDER)[number]);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const handlePress = (
    routeKey: string,
    routeName: string,
    routeParams: object | undefined,
    isFocused: boolean,
  ) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      void Haptics.selectionAsync();
      navigation.navigate(routeName, routeParams);
    }
  };

  const handleLongPress = (routeKey: string) => {
    navigation.emit({
      type: 'tabLongPress',
      target: routeKey,
    });
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0"
      style={{ height: totalHeight }}
    >
      {/* Curved SVG background */}
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: totalHeight,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        }}
      >
        <Svg width={width} height={totalHeight}>
          <Path d={path} fill={COLORS.primary} />
        </Svg>
      </View>

      {/* Tab buttons row above bottom safe area */}
      <View
        pointerEvents="box-none"
        className="relative flex-row items-center"
        style={{ height: BAR_HEIGHT }}
      >
        {orderedRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key];

          if (route.name === 'index') {
            return (
              <View
                key={route.key}
                pointerEvents="box-none"
                className="relative flex-1 items-center justify-center"
              >
                <CenterFabButton
                  isFocused={isFocused}
                  primaryColor={COLORS.primary}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={() =>
                    handlePress(route.key, route.name, route.params, isFocused)
                  }
                  onLongPress={() => handleLongPress(route.key)}
                />
              </View>
            );
          }

          const isHistory = route.name === 'history';
          return (
            <SideTabButton
              key={route.key}
              label={isHistory ? 'Historial' : 'Ajustes'}
              isHistory={isHistory}
              isFocused={isFocused}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={() =>
                handlePress(route.key, route.name, route.params, isFocused)
              }
              onLongPress={() => handleLongPress(route.key)}
            />
          );
        })}
      </View>

      {/* Bottom safe area spacer */}
      {bottomInset > 0 && <View style={{ height: bottomInset }} />}
    </View>
  );
}
