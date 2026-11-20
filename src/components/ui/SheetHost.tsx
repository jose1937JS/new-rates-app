import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useSheetStore, type SheetEntry } from '@/store/sheetStore';

function finishSheetClose(id: string) {
  useSheetStore.getState().finishClose(id);
}

function SheetSurface({ sheet }: { sheet: SheetEntry }) {
  const sheetId = sheet.id;
  const sheetVisible = sheet.visible;
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const offscreenY = Math.max(windowHeight, 560);
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(offscreenY);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (sheetVisible) {
      backdropOpacity.set(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      );
      translateY.set(
        withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      Keyboard.dismiss();
      backdropOpacity.set(
        withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }),
      );
      translateY.set(
        withTiming(
          offscreenY,
          { duration: 210, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(finishSheetClose)(sheetId);
            }
          },
        ),
      );
    }
  }, [sheetVisible, sheetId, offscreenY, backdropOpacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.get(),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const content = (
    <>
      <Animated.View
        pointerEvents={sheet.visible ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0, 0, 0, 0.55)' },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={sheet.onClose} />
      </Animated.View>

      <Animated.View
        style={[
          {
            maxHeight: '90%',
            width: '100%',
            backgroundColor: COLORS.surfaceCard,
            borderColor: COLORS.border,
            borderTopWidth: 1,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderCurve: 'continuous',
            paddingBottom:
              keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 16),
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle + Header */}
        <View className="items-center pt-2.5">
          <View
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: COLORS.border }}
          />
        </View>

        <View
          className="flex-row items-center justify-between border-b px-5 pb-3 pt-2.5"
          style={{ borderColor: COLORS.border }}
        >
          <View className="flex-1 pr-3">
            <Text
              className="text-base font-semibold text-text-primary"
              numberOfLines={1}
            >
              {sheet.title}
            </Text>
            {sheet.subtitle ? (
              <Text
                className="text-xs text-text-secondary"
                numberOfLines={1}
              >
                {sheet.subtitle}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={sheet.onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="h-8 w-8 items-center justify-center rounded-full bg-surface-elevated active:opacity-75"
          >
            <X size={16} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {sheet.scrollable !== false ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 14,
            }}
          >
            {sheet.children}
          </ScrollView>
        ) : (
          <View className="px-5 py-3.5">{sheet.children}</View>
        )}

        {sheet.footer ? (
          <View
            className="border-t px-5 pt-3"
            style={{ borderColor: COLORS.border }}
          >
            {sheet.footer}
          </View>
        ) : null}
      </Animated.View>
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        pointerEvents={sheet.visible ? 'box-none' : 'none'}
        style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      pointerEvents={sheet.visible ? 'box-none' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        {
          justifyContent: 'flex-end',
          paddingBottom: keyboardHeight,
        },
      ]}
    >
      {content}
    </View>
  );
}

export function SheetHost() {
  const sheets = useSheetStore((state) => state.sheets);
  const topVisibleSheet =
    [...sheets].reverse().find((sheet) => sheet.visible) ?? null;

  useEffect(() => {
    if (!topVisibleSheet) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      topVisibleSheet.onClose();
      return true;
    });

    return () => sub.remove();
  }, [topVisibleSheet]);

  if (sheets.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 90, elevation: 24 },
      ]}
    >
      {sheets.map((sheet) => (
        <SheetSurface key={sheet.id} sheet={sheet} />
      ))}
    </View>
  );
}
