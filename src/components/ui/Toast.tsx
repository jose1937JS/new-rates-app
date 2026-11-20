import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useToastStore } from '@/store/toastStore';

export function Toast() {
  const insets = useSafeAreaInsets();
  const COLORS = useThemeColors();
  const { id, visible, message, variant } = useToastStore();

  if (!visible || !message) return null;

  const accent =
    variant === 'error'
      ? COLORS.danger
      : variant === 'success'
        ? COLORS.success
        : COLORS.primary;

  const Icon =
    variant === 'error'
      ? AlertCircle
      : variant === 'success'
        ? CheckCircle2
        : Info;

  return (
    <View
      pointerEvents="none"
      className="absolute left-4 right-4 z-[99] items-center"
      style={{ top: insets.top + 12 }}
    >
      <Animated.View
        key={id}
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(180)}
        className="flex-row items-center gap-2 rounded-2xl border bg-surface-card px-4 py-2.5"
        style={{
          borderColor: accent,
          borderCurve: 'continuous',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.16,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Icon size={16} color={accent} />
        <Text className="text-xs font-semibold text-text-primary">
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}
