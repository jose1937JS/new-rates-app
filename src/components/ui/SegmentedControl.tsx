import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import { triggerSelectionHaptic } from '@/utils/haptics';

const TRACK_PADDING = 4;
const TAB_GAP = 4;
const SPRING_CONFIG = { damping: 20, stiffness: 240, mass: 0.8 };

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  badge?: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  selected: T;
  onSelect: (id: T) => void;
  scrollable?: boolean;
  compact?: boolean;
  variant?: 'default' | 'hero';
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
  scrollable = false,
  compact = false,
  variant = 'default',
}: SegmentedControlProps<T>) {
  const COLORS = useThemeColors();
  const isHero = variant === 'hero';
  const trackBg = isHero ? 'rgba(0, 0, 0, 0.16)' : COLORS.surfaceElevated;
  const pillBg = isHero ? '#ffffff' : COLORS.primary;
  const activeColor = isHero ? COLORS.primary : '#ffffff';
  const inactiveColor = isHero ? 'rgba(255, 255, 255, 0.9)' : COLORS.textSecondary;
  const activeBadgeColor = isHero
    ? COLORS.primary
    : 'rgba(255, 255, 255, 0.85)';

  // Fixed equal-width mode state
  const [trackWidth, setTrackWidth] = useState(0);
  const fixedTranslateX = useSharedValue(0);
  const fixedInitRef = useRef(false);

  const count = options.length;
  const itemWidth =
    !scrollable && trackWidth > 0 && count > 0
      ? Math.max(
          0,
          (trackWidth - TRACK_PADDING * 2 - TAB_GAP * Math.max(count - 1, 0)) /
            count,
        )
      : 0;
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.id === selected),
  );

  useEffect(() => {
    if (scrollable || itemWidth <= 0) return;
    const targetX = activeIndex * (itemWidth + TAB_GAP);
    if (!fixedInitRef.current) {
      fixedInitRef.current = true;
      fixedTranslateX.set(targetX);
    } else {
      fixedTranslateX.set(withSpring(targetX, SPRING_CONFIG));
    }
  }, [scrollable, activeIndex, itemWidth, fixedTranslateX]);

  // Scrollable measured-width mode state
  const scrollRef = useRef<ScrollView>(null);
  const scrollInitRef = useRef(false);
  const [layouts, setLayouts] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  useEffect(() => {
    if (!scrollable) return;
    const target = layouts[selected];
    if (!target) return;

    if (!scrollInitRef.current) {
      scrollInitRef.current = true;
      pillX.set(target.x);
      pillWidth.set(target.width);
      pillOpacity.set(1);
    } else {
      pillX.set(withSpring(target.x, SPRING_CONFIG));
      pillWidth.set(withSpring(target.width, SPRING_CONFIG));
      pillOpacity.set(1);
      scrollRef.current?.scrollTo({
        x: Math.max(0, target.x - 40),
        animated: true,
      });
    }
  }, [scrollable, selected, layouts, pillX, pillWidth, pillOpacity]);

  const fixedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: fixedTranslateX.get() }],
  }));

  const scrollIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.get() }],
    width: pillWidth.get(),
    opacity: pillOpacity.get(),
  }));

  const handlePress = (id: T) => {
    if (id === selected) return;
    triggerSelectionHaptic();
    onSelect(id);
  };

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 1 }}
      >
        <View
          className="relative flex-row items-center rounded-xl border p-1"
          style={{
            gap: TAB_GAP,
            backgroundColor: trackBg,
            borderColor: isHero ? 'transparent' : COLORS.border,
            borderCurve: 'continuous',
          }}
        >
          <Animated.View
            pointerEvents="none"
            className="absolute bottom-1 top-1 rounded-lg"
            style={[
              {
                left: 0,
                backgroundColor: pillBg,
                borderCurve: 'continuous',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 1,
              },
              scrollIndicatorStyle,
            ]}
          />

          {options.map((option) => {
            const isActive = option.id === selected;
            return (
              <Pressable
                key={option.id}
                onPress={() => handlePress(option.id)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setLayouts((prev) => {
                    const curr = prev[option.id];
                    if (
                      curr &&
                      Math.abs(curr.x - x) < 0.5 &&
                      Math.abs(curr.width - width) < 0.5
                    ) {
                      return prev;
                    }
                    return { ...prev, [option.id]: { x, width } };
                  });
                }}
                className={`flex-row items-center justify-center gap-1.5 rounded-lg ${
                  compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
                }`}
                style={{ borderCurve: 'continuous' }}
              >
                {option.icon}
                <Text
                  className="text-xs font-medium"
                  style={{ color: isActive ? activeColor : inactiveColor }}
                >
                  {option.label}
                </Text>
                {option.badge ? (
                  <Text
                    className="text-[11px] font-medium"
                    style={{
                      color: isActive ? activeBadgeColor : COLORS.textMuted,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {option.badge}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className="relative flex-row items-center rounded-xl border p-1"
      style={{
        gap: TAB_GAP,
        backgroundColor: trackBg,
        borderColor: isHero ? 'transparent' : COLORS.border,
        borderCurve: 'continuous',
      }}
    >
      {itemWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          className="absolute bottom-1 left-1 top-1 rounded-lg"
          style={[
            {
              width: itemWidth,
              backgroundColor: pillBg,
              borderCurve: 'continuous',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isHero ? 0.12 : 0.08,
              shadowRadius: 3,
              elevation: isHero ? 2 : 1,
            },
            fixedIndicatorStyle,
          ]}
        />
      )}

      {options.map((option) => {
        const isActive = option.id === selected;
        return (
          <Pressable
            key={option.id}
            onPress={() => handlePress(option.id)}
            className={`flex-1 flex-row items-center justify-center gap-1 rounded-lg ${
              compact ? 'py-1.5' : 'py-2'
            }`}
            style={{ borderCurve: 'continuous' }}
          >
            {option.icon}
            <Text
              className="text-xs font-medium"
              style={{ color: isActive ? activeColor : inactiveColor }}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
