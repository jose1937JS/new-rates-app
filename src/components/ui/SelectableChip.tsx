import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import { triggerSelectionHaptic } from '@/utils/haptics';

interface SelectableChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  tintMode?: 'soft' | 'solid';
}

export function SelectableChip({
  label,
  active,
  onPress,
  tintMode = 'soft',
}: SelectableChipProps) {
  const COLORS = useThemeColors();
  const progress = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.set(withTiming(active ? 1 : 0, { duration: 160 }));
  }, [active, progress]);

  const activeBg =
    tintMode === 'solid' ? COLORS.primary : `${COLORS.primary}20`;
  const activeTextColor = tintMode === 'solid' ? '#ffffff' : COLORS.primary;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [COLORS.surfaceElevated, activeBg],
    ),
    borderColor: interpolateColor(
      progress.get(),
      [0, 1],
      [COLORS.border, COLORS.primary],
    ),
  }));

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onPress();
      }}
      onPressIn={() => {
        scale.set(withTiming(0.95, { duration: 80 }));
      }}
      onPressOut={() => {
        scale.set(withTiming(1, { duration: 120 }));
      }}
    >
      <Animated.View
        className="rounded-xl border px-3 py-1.5"
        style={[{ borderCurve: 'continuous' }, containerStyle]}
      >
        <Text
          className="text-xs font-medium"
          style={{ color: active ? activeTextColor : COLORS.textSecondary }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
