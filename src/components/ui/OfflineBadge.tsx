import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface OfflineBadgeProps {
  isOnline: boolean;
  variant?: 'default' | 'hero';
  showOnline?: boolean;
}

export function OfflineBadge({
  isOnline,
  variant = 'default',
  showOnline = true,
}: OfflineBadgeProps) {
  if (isOnline && !showOnline) return null;

  const isHero = variant === 'hero';
  const containerBg = isHero
    ? 'bg-white'
    : isOnline
      ? 'bg-success/15'
      : 'bg-danger/15';
  const dotColor = isOnline ? 'bg-success' : 'bg-danger';
  const textColor = isOnline ? 'text-success' : 'text-danger';

  return (
    <Animated.View
      key={isOnline ? 'online' : 'offline'}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${containerBg}`}
    >
      <View className={`h-2 w-2 rounded-full ${dotColor}`} />
      <Text className={`text-xs font-medium ${textColor}`}>
        {isOnline ? 'Conectado' : 'Sin conexión'}
      </Text>
    </Animated.View>
  );
}
