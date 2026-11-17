import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  Check,
  ChevronRight,
  Coins,
  Database,
  Globe,
  Info,
  Landmark,
  Laptop,
  Moon,
  Palette,
  RefreshCw,
  Server,
  Settings,
  Sun,
  Tag,
  Trash2,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppModal, type AppModalVariant } from '@/components/ui/AppModal';
import { Card } from '@/components/ui/Card';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  clearApiCache,
  expireApiCache,
  isNetworkOnline,
} from '@/services/ratesApi';
import { useCurrencyStore } from '@/store/currencyStore';
import type { PrimaryColorId, ThemeMode } from '@/types/currency.types';
import {
  APP_NAME,
  APP_VERSION,
  PRIMARY_COLOR_OPTIONS,
} from '@/utils/constants';

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  variant: AppModalVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}

const CLOSED_MODAL: ModalState = {
  visible: false,
  title: '',
  message: '',
  variant: 'info',
};

function SettingsGroup({
  title,
  icon,
  children,
  index,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(350)}>
      <Card title={title} icon={icon} contentClassName="pt-1">
        {children}
      </Card>
    </Animated.View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  isLast,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const COLORS = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between py-2.5 active:opacity-75 ${
        !isLast ? 'border-b border-border/40' : ''
      }`}
    >
      <View className="flex-row items-center gap-2.5">
        {icon}
        <Text
          className={`text-sm font-medium ${
            destructive ? 'text-danger' : 'text-text-primary'
          }`}
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        {value ? (
          <Text className="text-xs text-text-muted">{value}</Text>
        ) : null}
        {onPress ? (
          <ChevronRight
            size={14}
            color={destructive ? COLORS.danger : COLORS.textMuted}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function ThemeOption({
  icon,
  mode,
  label,
  currentMode,
  onPress,
  isLast,
}: {
  icon?: React.ReactNode;
  mode: ThemeMode;
  label: string;
  currentMode: ThemeMode;
  onPress: () => void;
  isLast?: boolean;
}) {
  const COLORS = useThemeColors();
  const isActive = mode === currentMode;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between py-2.5 active:opacity-75 ${
        !isLast ? 'border-b border-border/40' : ''
      }`}
    >
      <View className="flex-row items-center gap-2.5">
        {icon}
        <Text
          className={`text-sm ${
            isActive ? 'font-semibold' : 'font-medium text-text-primary'
          }`}
          style={isActive ? { color: COLORS.primary } : undefined}
        >
          {label}
        </Text>
      </View>
      <View
        className="h-4 w-4 items-center justify-center rounded-full border-2"
        style={{
          borderColor: isActive ? COLORS.primary : COLORS.textMuted,
        }}
      >
        {isActive && (
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          />
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useCurrencyStore();

  const [modalState, setModalState] = useState<ModalState>(CLOSED_MODAL);

  const closeModal = () => setModalState(CLOSED_MODAL);

  const handleForceRefresh = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const online = await isNetworkOnline();
    if (!online) {
      setModalState({
        visible: true,
        title: 'Sin conexión',
        message: 'No hay conexión a internet. Se mantendrán las tasas guardadas en caché.',
        variant: 'warning',
        confirmText: 'Entendido',
      });
      return;
    }

    await expireApiCache();
    await queryClient.invalidateQueries();
    setModalState({
      visible: true,
      title: 'Actualizado',
      message: 'Las tasas se han actualizado correctamente.',
      variant: 'success',
      confirmText: 'Listo',
    });
  };

  const handleClearCache = () => {
    setModalState({
      visible: true,
      title: 'Limpiar caché',
      message:
        '¿Estás seguro? Se eliminarán las tasas almacenadas localmente.',
      variant: 'danger',
      confirmText: 'Limpiar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        queryClient.clear();
        await clearApiCache();
        setModalState({
          visible: true,
          title: 'Listo',
          message: 'La caché ha sido limpiada.',
          variant: 'success',
          confirmText: 'Aceptar',
        });
      },
    });
  };

  const handleThemeChange = (mode: ThemeMode) => {
    void Haptics.selectionAsync();
    setThemeMode(mode);
  };

  const handlePrimaryColorChange = (colorId: PrimaryColorId) => {
    if (colorId === primaryColor) return;
    void Haptics.selectionAsync();
    setPrimaryColor(colorId);
  };

  return (
    <View
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      {/* Fixed compact Hero */}
      <ScreenHero
        title="Ajustes"
        subtitle="Apariencia, caché y fuentes"
        icon={<Settings size={20} color="#ffffff" />}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 104 + insets.bottom,
          gap: 16,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        {/* App info */}
        <SettingsGroup
          title="Aplicación"
          icon={<Info size={16} color={COLORS.primary} />}
          index={0}
        >
          <SettingsRow
            icon={<User size={16} color={COLORS.textMuted} />}
            label="Autor"
            value="DevLopez"
          />
          <SettingsRow
            icon={<Globe size={16} color={COLORS.primary} />}
            label="Sitio Web"
            value="devlopez.vercel.app"
            onPress={() => Linking.openURL('https://devlopez.vercel.app')}
          />
          <SettingsRow
            icon={<Tag size={16} color={COLORS.textMuted} />}
            label="Versión"
            value={APP_VERSION}
            isLast
          />
        </SettingsGroup>

        {/* Theme & Primary Color */}
        <SettingsGroup
          title="Apariencia"
          icon={<Palette size={16} color={COLORS.primary} />}
          index={1}
        >
          <ThemeOption
            icon={
              <Moon
                size={16}
                color={themeMode === 'dark' ? COLORS.primary : COLORS.textMuted}
              />
            }
            mode="dark"
            label="Oscuro"
            currentMode={themeMode}
            onPress={() => handleThemeChange('dark')}
          />
          <ThemeOption
            icon={
              <Sun
                size={16}
                color={themeMode === 'light' ? COLORS.primary : COLORS.textMuted}
              />
            }
            mode="light"
            label="Claro"
            currentMode={themeMode}
            onPress={() => handleThemeChange('light')}
          />
          <ThemeOption
            icon={
              <Laptop
                size={16}
                color={
                  themeMode === 'system' ? COLORS.primary : COLORS.textMuted
                }
              />
            }
            mode="system"
            label="Automático (Sistema)"
            currentMode={themeMode}
            onPress={() => handleThemeChange('system')}
          />
        </SettingsGroup>

        <SettingsGroup
          title="Color principal"
          icon={<Palette size={16} color={COLORS.primary} />}
          index={2}
        >
            {/* Primary Color Picker */}
          <View className="pt-3">
            <View className="flex-row flex-wrap items-center justify-between">
              {PRIMARY_COLOR_OPTIONS.map((option) => {
                const isSelected = option.id === primaryColor;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handlePrimaryColorChange(option.id)}
                    accessibilityLabel={`Color ${option.label}`}
                    className="items-center gap-1 active:opacity-80"
                  >
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full border-2"
                      style={{
                        backgroundColor: option.primary,
                        borderColor: isSelected
                          ? COLORS.textPrimary
                          : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <Check size={16} color="#ffffff" strokeWidth={2.8} />
                      )}
                    </View>
                    <Text
                      className="text-[10px]"
                      style={{
                        color: isSelected ? COLORS.primary : COLORS.textMuted,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SettingsGroup>

        {/* Data */}
        <SettingsGroup
          title="Datos"
          icon={<Database size={16} color={COLORS.primary} />}
          index={2}
        >
          <SettingsRow
            icon={<RefreshCw size={16} color={COLORS.primary} />}
            label="Forzar actualización"
            onPress={handleForceRefresh}
          />
          <SettingsRow
            icon={<Trash2 size={16} color={COLORS.danger} />}
            label="Limpiar caché"
            onPress={handleClearCache}
            destructive
            isLast
          />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup
          title="Fuentes de datos"
          icon={<Server size={16} color={COLORS.primary} />}
          index={3}
        >
          <SettingsRow
            icon={<Landmark size={16} color={COLORS.textMuted} />}
            label="BCV"
            value="USD, EUR"
          />
          <SettingsRow
            icon={<Coins size={16} color={COLORS.textMuted} />}
            label="Yadio"
            value="USDT"
            isLast
          />
        </SettingsGroup>

        {/* Footer */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(350)}
          className="items-center pt-2"
        >
          <Text className="text-xs text-text-muted">
            {APP_NAME} v{APP_VERSION}
          </Text>
          <Text className="mt-1 text-xs text-text-muted">
            Datos desde Rates Cloudflare API
          </Text>
        </Animated.View>
      </ScrollView>

      <AppModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onClose={closeModal}
      />
    </View>
  );
}
