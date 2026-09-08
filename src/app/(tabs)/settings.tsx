import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  Coins,
  Globe,
  Landmark,
  Laptop,
  Moon,
  RefreshCw,
  Sun,
  Tag,
  Trash2,
  User
} from 'lucide-react-native';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useCurrencyStore } from '@/store/currencyStore';
import type { ThemeMode } from '@/types/currency.types';
import { APP_NAME, APP_VERSION } from '@/utils/constants';

function SettingsGroup({
  title,
  children,
  index,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      className="gap-1"
    >
      <Text className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-2xl bg-surface-card"
        style={{ borderCurve: 'continuous' }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between border-b border-border px-4 py-3.5 active:bg-surface-elevated"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text
          className={`text-base ${destructive ? 'text-danger' : 'text-text-primary'}`}
        >
          {label}
        </Text>
      </View>
      {value && <Text className="text-sm text-text-muted">{value}</Text>}
    </Pressable>
  );
}

function ThemeOption({
  icon,
  mode,
  label,
  currentMode,
  onPress,
}: {
  icon?: React.ReactNode;
  mode: ThemeMode;
  label: string;
  currentMode: ThemeMode;
  onPress: () => void;
}) {
  const isActive = mode === currentMode;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-border px-4 py-3.5 active:bg-surface-elevated"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-base text-text-primary">{label}</Text>
      </View>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
          isActive ? 'border-primary' : 'border-text-muted'
        }`}
      >
        {isActive && (
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const COLORS = useThemeColors();
  const { themeMode, setThemeMode } = useCurrencyStore();

  const handleForceRefresh = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries();
    Alert.alert('Actualizado', 'Las tasas se han actualizado correctamente.');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar caché',
      '¿Estás seguro? Se eliminarán todos los datos almacenados localmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
            queryClient.clear();
            await AsyncStorage.clear();
            Alert.alert('Listo', 'La caché ha sido limpiada.');
          },
        },
      ],
    );
  };

  const handleThemeChange = (mode: ThemeMode) => {
    void Haptics.selectionAsync();
    setThemeMode(mode);
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* App info */}
      <SettingsGroup title="Aplicación" index={0}>
        <SettingsRow
          icon={<User size={18} color={COLORS.textMuted} />}
          label="Autor"
          value="DevLopez"
        />
        <SettingsRow
          icon={<Globe size={18} color={COLORS.textMuted} />}
          label="Sitio Web"
          value="devlopez.vercel.app"
          onPress={() => Linking.openURL('https://devlopez.vercel.app')}
        />
        <SettingsRow
          icon={<Tag size={18} color={COLORS.textMuted} />}
          label="Versión"
          value={APP_VERSION}
        />
      </SettingsGroup>

      {/* Theme */}
      <SettingsGroup title="Apariencia" index={1}>
        <ThemeOption
          icon={<Moon size={18} color={themeMode === 'dark' ? COLORS.primary : COLORS.textMuted} />}
          mode="dark"
          label="Oscuro"
          currentMode={themeMode}
          onPress={() => handleThemeChange('dark')}
        />
        <ThemeOption
          icon={<Sun size={18} color={themeMode === 'light' ? COLORS.primary : COLORS.textMuted} />}
          mode="light"
          label="Claro"
          currentMode={themeMode}
          onPress={() => handleThemeChange('light')}
        />
        <ThemeOption
          icon={<Laptop size={18} color={themeMode === 'system' ? COLORS.primary : COLORS.textMuted} />}
          mode="system"
          label="Automático (Sistema)"
          currentMode={themeMode}
          onPress={() => handleThemeChange('system')}
        />
      </SettingsGroup>

      {/* Data */}
      <SettingsGroup title="Datos" index={2}>
        <SettingsRow
          icon={<RefreshCw size={18} color={COLORS.primary} />}
          label="Forzar actualización"
          onPress={handleForceRefresh}
        />
        <SettingsRow
          icon={<Trash2 size={18} color={COLORS.danger} />}
          label="Limpiar caché"
          onPress={handleClearCache}
          destructive
        />
      </SettingsGroup>

      {/* About */}
      <SettingsGroup title="Fuentes de datos" index={3}>
        <SettingsRow
          icon={<Landmark size={18} color={COLORS.textMuted} />}
          label="BCV"
          value="USD, EUR"
        />
        <SettingsRow
          icon={<Coins size={18} color={COLORS.textMuted} />}
          label="Binance P2P"
          value="USDT"
        />
      </SettingsGroup>

      {/* Footer */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        className="items-center pt-4"
      >
        <Text className="text-xs text-text-muted">
          {APP_NAME} v{APP_VERSION}
        </Text>
        <Text className="mt-1 text-xs text-text-muted">
          Datos proporcionados por DolarVZLA
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
