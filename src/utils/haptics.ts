import * as Haptics from 'expo-haptics';

import { useCurrencyStore } from '@/store/currencyStore';

const IMPACT_STYLES = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

const NOTIFICATION_TYPES = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
} as const;

function isHapticsEnabled(): boolean {
  return useCurrencyStore.getState().hapticsEnabled;
}

/** Triggers a subtle selection haptic if haptics are enabled in settings. */
export function triggerSelectionHaptic(): void {
  if (!isHapticsEnabled()) return;
  void Haptics.selectionAsync();
}

/** Triggers an impact haptic if haptics are enabled in settings. */
export function triggerImpactHaptic(
  style: keyof typeof IMPACT_STYLES = 'light',
): void {
  if (!isHapticsEnabled()) return;
  void Haptics.impactAsync(IMPACT_STYLES[style]);
}

/** Triggers a notification haptic if haptics are enabled in settings. */
export function triggerNotificationHaptic(
  type: keyof typeof NOTIFICATION_TYPES = 'success',
): void {
  if (!isHapticsEnabled()) return;
  void Haptics.notificationAsync(NOTIFICATION_TYPES[type]);
}
