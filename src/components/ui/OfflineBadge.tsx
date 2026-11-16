import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface OfflineBadgeProps {
  isOnline: boolean;
  variant?: 'default' | 'hero';
}

export function OfflineBadge({ isOnline, variant = 'default' }: OfflineBadgeProps) {
  if (isOnline) return null;

  const isHero = variant === 'hero';

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
        isHero ? 'bg-white' : 'bg-danger/15'
      }`}
    >
      <View className="h-2 w-2 rounded-full bg-danger" />
      <Text className="text-xs font-medium text-danger">Sin conexión</Text>
    </Animated.View>
  );
}
