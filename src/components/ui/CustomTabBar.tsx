import type { Tabs } from 'expo-router';
import {
  ArrowLeftRight,
  LayoutGrid,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  ZoomIn,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useThemeColors';
import { triggerSelectionHaptic } from '@/utils/haptics';

export type CustomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

type TabRouteName = 'history' | 'shopping' | 'index' | 'tools' | 'settings';

const TAB_ORDER: readonly TabRouteName[] = [
  'history',
  'shopping',
  'index',
  'tools',
  'settings',
];

const TAB_META: Record<
  TabRouteName,
  {
    label: string;
    shortLabel: string;
    Icon: React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;
  }
> = {
  history: { label: 'Historial', shortLabel: 'Historial', Icon: TrendingUp },
  shopping: { label: 'Compras', shortLabel: 'Compras', Icon: ShoppingCart },
  index: { label: 'Conversor', shortLabel: 'Conversor', Icon: ArrowLeftRight },
  tools: { label: 'Herramientas', shortLabel: 'Utilidades', Icon: LayoutGrid },
  settings: { label: 'Ajustes', shortLabel: 'Ajustes', Icon: Settings },
};

const BAR_HEIGHT = 60;
const FAB_SIZE = 50;
const FAB_TOP_OFFSET = -26;
const CORNER_RADIUS = 28;
const NOTCH_HALF_WIDTH = 50;
const NOTCH_DEPTH = 32;

const SPRING_CONFIG = {
  damping: 19,
  stiffness: 230,
  mass: 0.85,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getTabBarPath(
  centerX: number,
  width: number,
  totalHeight: number,
): string {
  'worklet';
  const safeW = Math.max(width, 200);
  const minEdge = 6;
  const cx = Math.min(Math.max(centerX, 24), safeW - 24);
  const leftShoulder = Math.max(minEdge, cx - NOTCH_HALF_WIDTH);
  const rightShoulder = Math.min(safeW - minEdge, cx + NOTCH_HALF_WIDTH);
  const leftCorner = Math.min(CORNER_RADIUS, Math.max(4, leftShoulder - 2));
  const rightCorner = Math.min(
    CORNER_RADIUS,
    Math.max(4, safeW - rightShoulder - 2),
  );

  const dxLeft = cx - leftShoulder;
  const dxRight = rightShoulder - cx;

  return [
    `M 0,${leftCorner}`,
    `Q 0,0 ${leftCorner},0`,
    `L ${leftShoulder},0`,
    `C ${leftShoulder + dxLeft * 0.50},0 ${cx - dxLeft * 0.50},${NOTCH_DEPTH} ${cx},${NOTCH_DEPTH}`,
    `C ${cx + dxRight * 0.50},${NOTCH_DEPTH} ${rightShoulder - dxRight * 0.50},0 ${rightShoulder},0`,
    `L ${safeW - rightCorner},0`,
    `Q ${safeW},0 ${safeW},${rightCorner}`,
    `L ${safeW},${totalHeight}`,
    `L 0,${totalHeight}`,
    'Z',
  ].join(' ');
}

interface DynamicFabProps {
  activeRouteName: TabRouteName;
  activeX: SharedValue<number>;
  primaryColor: string;
  onPress: () => void;
}

function DynamicFab({
  activeRouteName,
  activeX,
  primaryColor,
  onPress,
}: DynamicFabProps) {
  const pressScale = useSharedValue(1);
  const meta = TAB_META[activeRouteName] ?? TAB_META.index;
  const ActiveIcon = meta.Icon;

  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: activeX.get() - FAB_SIZE / 2 },
      { scale: pressScale.get() },
    ],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={meta.label}
      accessibilityState={{ selected: true }}
      onPress={onPress}
      onPressIn={() => pressScale.set(withTiming(0.92, { duration: 90 }))}
      onPressOut={() => pressScale.set(withTiming(1, { duration: 120 }))}
      className="absolute items-center justify-center rounded-full"
      style={[
        positionStyle,
        {
          top: FAB_TOP_OFFSET,
          left: 0,
          width: FAB_SIZE,
          height: FAB_SIZE,
          backgroundColor: primaryColor,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.24,
          shadowRadius: 6,
          elevation: 6,
        },
      ]}
    >
      <Animated.View key={activeRouteName} entering={ZoomIn.duration(170)}>
        <ActiveIcon size={23} color="#ffffff" strokeWidth={2.4} />
      </Animated.View>
    </AnimatedPressable>
  );
}

interface TabSlotButtonProps {
  routeName: TabRouteName;
  slotIndex: number;
  slotWidth: number;
  activeX: SharedValue<number>;
  isFocused: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabSlotButton({
  routeName,
  slotIndex,
  slotWidth,
  activeX,
  isFocused,
  accessibilityLabel,
  onPress,
  onLongPress,
}: TabSlotButtonProps) {
  const meta = TAB_META[routeName] ?? TAB_META.index;
  const IconComponent = meta.Icon;
  const slotCenterX = slotIndex * slotWidth + slotWidth / 2;

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeX.get() - slotCenterX);
    const threshold = Math.max(slotWidth * 0.55, 24);
    return {
      opacity: interpolate(
        distance,
        [0, threshold],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            distance,
            [0, threshold],
            [-12, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const inactiveColor = 'rgba(255, 255, 255, 0.78)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? meta.label}
      onPress={onPress}
      onLongPress={onLongPress}
      className="h-full flex-1 items-center justify-end pb-1.5 pt-2 active:opacity-75"
    >
      <Animated.View style={iconAnimatedStyle} className="mb-1">
        <IconComponent size={21} color={inactiveColor} strokeWidth={1.9} />
      </Animated.View>
      <Text
        className={`text-[10px] ${
          isFocused ? 'font-bold text-white' : 'font-medium'
        }`}
        style={isFocused ? undefined : { color: inactiveColor }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {meta.shortLabel}
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

  const safeWidth = Math.max(width, 320);
  const bottomInset = insets.bottom - 5;
  const totalHeight = BAR_HEIGHT + bottomInset;

  const orderedRoutes = [...state.routes].sort((a, b) => {
    const idxA = TAB_ORDER.indexOf(a.name as TabRouteName);
    const idxB = TAB_ORDER.indexOf(b.name as TabRouteName);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const slotCount = Math.max(orderedRoutes.length, 1);
  const slotWidth = safeWidth / slotCount;
  const focusedRoute = state.routes[state.index];
  const activeVisualIndex = Math.max(
    0,
    orderedRoutes.findIndex((r) => r.key === focusedRoute?.key),
  );
  const targetCenterX = activeVisualIndex * slotWidth + slotWidth / 2;

  const activeX = useSharedValue(targetCenterX);

  useEffect(() => {
    activeX.set(withSpring(targetCenterX, SPRING_CONFIG));
  }, [activeX, targetCenterX]);

  const animatedPathProps = useAnimatedProps(() => ({
    d: getTabBarPath(activeX.get(), safeWidth, totalHeight),
  }));

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
      triggerSelectionHaptic();
      navigation.navigate(routeName, routeParams);
    }
  };

  const handleLongPress = (routeKey: string) => {
    navigation.emit({
      type: 'tabLongPress',
      target: routeKey,
    });
  };

  const activeRouteName = (focusedRoute?.name as TabRouteName) ?? 'index';

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0"
      style={{ height: totalHeight }}
    >
      {/* Dynamic notched SVG bar */}
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: totalHeight,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.14,
          shadowRadius: 10,
        }}
      >
        <Svg width={safeWidth} height={totalHeight}>
          <AnimatedPath
            animatedProps={animatedPathProps}
            fill={COLORS.primary}
          />
        </Svg>
      </View>

      {/* Dynamic floating active bubble */}
      <DynamicFab
        activeRouteName={activeRouteName}
        activeX={activeX}
        primaryColor={COLORS.primary}
        onPress={() => {
          if (focusedRoute) {
            handlePress(
              focusedRoute.key,
              focusedRoute.name,
              focusedRoute.params,
              true,
            );
          }
        }}
      />

      {/* Tab slots row */}
      <View
        pointerEvents="box-none"
        className="relative flex-row items-end"
        style={{ height: BAR_HEIGHT }}
      >
        {orderedRoutes.map((route, slotIndex) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key];

          return (
            <TabSlotButton
              key={route.key}
              routeName={route.name as TabRouteName}
              slotIndex={slotIndex}
              slotWidth={slotWidth}
              activeX={activeX}
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

      {bottomInset > 0 && <View style={{ height: bottomInset }} />}
    </View>
  );
}
