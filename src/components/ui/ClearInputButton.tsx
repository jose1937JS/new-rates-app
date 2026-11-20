import { X } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { triggerSelectionHaptic } from '@/utils/haptics';

interface ClearInputButtonProps {
  visible: boolean;
  onPress: () => void;
  size?: number;
}

export function ClearInputButton({
  visible,
  onPress,
  size = 14,
}: ClearInputButtonProps) {
  const COLORS = useThemeColors();
  if (!visible) return null;

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onPress();
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Limpiar texto"
      className="rounded-full p-1 active:opacity-70"
    >
      <X size={size} color={COLORS.textMuted} />
    </Pressable>
  );
}
