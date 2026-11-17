import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';

export type AppModalVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AppModalProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: AppModalVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export function AppModal({
  visible,
  title,
  message,
  variant = 'info',
  confirmText = 'Entendido',
  cancelText,
  onConfirm,
  onClose,
  loading = false,
}: AppModalProps) {
  const COLORS = useThemeColors();

  const accentColor =
    variant === 'danger' || variant === 'warning'
      ? COLORS.danger
      : COLORS.primary;

  const IconComponent =
    variant === 'danger'
      ? Trash2
      : variant === 'warning'
        ? AlertTriangle
        : variant === 'success'
          ? CheckCircle2
          : Info;

  const handleConfirm = () => {
    if (loading) return;
    void Haptics.selectionAsync();
    if (onConfirm) {
      void onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        {/* Backdrop tap to dismiss */}
        <Pressable
          className="absolute inset-0"
          onPress={() => {
            if (!loading) onClose();
          }}
        />

        <Animated.View
          entering={ZoomIn.duration(180)}
          className="w-full max-w-[340px] rounded-3xl border bg-surface-card p-5"
          style={{
            borderColor: COLORS.border,
            borderCurve: 'continuous',
          }}
        >
          {/* Icon badge */}
          <View className="mb-3 items-center">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${accentColor}1A`,
                borderCurve: 'continuous',
              }}
            >
              <IconComponent size={24} color={accentColor} />
            </View>
          </View>

          {/* Title & Message */}
          <Text className="text-center text-base font-bold text-text-primary">
            {title}
          </Text>
          <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary">
            {message}
          </Text>

          {/* Action buttons */}
          <View className="mt-5 flex-row gap-2.5">
            {cancelText ? (
              <Pressable
                onPress={onClose}
                disabled={loading}
                className="flex-1 items-center justify-center rounded-xl bg-surface-elevated py-3 active:opacity-80"
                style={{ borderCurve: 'continuous' }}
              >
                <Text className="text-sm font-semibold text-text-secondary">
                  {cancelText}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              className="flex-1 items-center justify-center rounded-xl py-3 active:opacity-85"
              style={{
                backgroundColor: accentColor,
                borderCurve: 'continuous',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  {confirmText}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
