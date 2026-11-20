import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
  Percent,
  RefreshCw,
  Server,
  Settings,
  SlidersHorizontal,
  Store,
  Sun,
  Tag,
  Trash2,
  User,
  Vibrate,
  VibrateOff,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { singleLineInputStyle } from '@/utils/inputStyles';
import { AppModal, type AppModalVariant } from '@/components/ui/AppModal';
import { AppSheet } from '@/components/ui/AppSheet';
import { Card } from '@/components/ui/Card';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  clearApiCache,
  expireApiCache,
  isNetworkOnline,
} from '@/services/ratesApi';
import { useCurrencyStore } from '@/store/currencyStore';
import { useCustomRateStore } from '@/store/customRateStore';
import type { PrimaryColorId, ThemeMode } from '@/types/currency.types';
import {
  APP_NAME,
  APP_VERSION,
  PRIMARY_COLOR_OPTIONS,
} from '@/utils/constants';
import {
  triggerImpactHaptic,
  triggerNotificationHaptic,
  triggerSelectionHaptic,
} from '@/utils/haptics';

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
            color={destructive ? COLORS.danger : COLORS.primary}
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
          className={`text-sm font-medium ${
            isActive ? '' : 'text-text-primary'
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    themeMode,
    setThemeMode,
    primaryColor,
    setPrimaryColor,
    hapticsEnabled,
    setHapticsEnabled,
    fiscalSettings,
    setFiscalSettings,
    businessName,
    setBusinessName,
  } = useCurrencyStore();
  const customRates = useCustomRateStore((state) => state.customRates);
  const activeCustomCount = customRates.filter((r) => r.enabled).length;

  const [modalState, setModalState] = useState<ModalState>(CLOSED_MODAL);
  const [commerceSheetVisible, setCommerceSheetVisible] = useState(false);
  const [draftBizName, setDraftBizName] = useState(businessName);
  const [draftIva, setDraftIva] = useState(String(fiscalSettings.ivaPercent));
  const [draftIgtf, setDraftIgtf] = useState(String(fiscalSettings.igtfPercent));
  const [commerceError, setCommerceError] = useState<string | null>(null);

  const openCommerceSheet = () => {
    triggerSelectionHaptic();
    setCommerceError(null);
    setDraftBizName(businessName);
    setDraftIva(String(fiscalSettings.ivaPercent));
    setDraftIgtf(String(fiscalSettings.igtfPercent));
    setCommerceSheetVisible(true);
  };

  const saveCommerceSettings = () => {
    const parsedIva = Number.parseFloat(draftIva.replace(',', '.'));
    const parsedIgtf = Number.parseFloat(draftIgtf.replace(',', '.'));
    if (!Number.isFinite(parsedIva) || parsedIva < 0 || parsedIva > 100) {
      setCommerceError('El porcentaje de IVA debe estar entre 0% y 100%.');
      return;
    }
    if (!Number.isFinite(parsedIgtf) || parsedIgtf < 0 || parsedIgtf > 100) {
      setCommerceError('El porcentaje de IGTF debe estar entre 0% y 100%.');
      return;
    }

    triggerImpactHaptic('light');
    setBusinessName(draftBizName.trim());
    setFiscalSettings({
      ivaPercent: parsedIva,
      igtfPercent: parsedIgtf,
    });
    setCommerceSheetVisible(false);
  };

  const closeModal = () => setModalState(CLOSED_MODAL);

  const handleForceRefresh = async () => {
    triggerImpactHaptic('light');
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
        triggerNotificationHaptic('warning');
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
    triggerSelectionHaptic();
    setThemeMode(mode);
  };

  const handlePrimaryColorChange = (colorId: PrimaryColorId) => {
    if (colorId === primaryColor) return;
    triggerSelectionHaptic();
    setPrimaryColor(colorId);
  };

  const handleToggleHaptics = (nextEnabled: boolean) => {
    setHapticsEnabled(nextEnabled);
    if (nextEnabled) {
      triggerSelectionHaptic();
    }
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
            value="José F. López"
          />
          <SettingsRow
            icon={<Globe size={16} color={COLORS.textMuted} />}
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
            isLast={true}
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
                        backgroundColor: COLORS.isDark
                          ? option.primaryDark
                          : option.primary,
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

        {/* Interaction */}
        <SettingsGroup
          title="Interacción"
          icon={<Vibrate size={16} color={COLORS.primary} />}
          index={3}
        >
          <Pressable
            onPress={() => handleToggleHaptics(!hapticsEnabled)}
            accessibilityRole="switch"
            accessibilityState={{ checked: hapticsEnabled }}
            accessibilityLabel="Vibración al tocar"
            className="flex-row items-center justify-between py-2 active:opacity-80"
          >
            <View className="flex-1 flex-row items-center gap-2.5 pr-3">
              {hapticsEnabled ? (
                <Vibrate size={16} color={COLORS.primary} />
              ) : (
                <VibrateOff size={16} color={COLORS.textMuted} />
              )}
              <View className="flex-1">
                <Text className="text-sm font-medium text-text-primary">
                  Vibración al tocar
                </Text>
                <Text className="text-xs text-text-muted">
                  Respuesta háptica en botones y gestos
                </Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{
                false: COLORS.border,
                true: `${COLORS.primary}80`,
              }}
              thumbColor={hapticsEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </Pressable>
        </SettingsGroup>

        {/* Commerce, Taxes & Custom Rates */}
        <SettingsGroup
          title="Comercio e impuestos"
          icon={<Store size={16} color={COLORS.primary} />}
          index={4}
        >
          <SettingsRow
            icon={<Store size={16} color={COLORS.textMuted} />}
            label="Nombre del negocio (tickets)"
            value={businessName || 'Sin definir'}
            onPress={openCommerceSheet}
          />
          <SettingsRow
            icon={<Percent size={16} color={COLORS.textMuted} />}
            label="IVA / IGTF configurados"
            value={`${fiscalSettings.ivaPercent}% / ${fiscalSettings.igtfPercent}%`}
            onPress={openCommerceSheet}
          />
          <SettingsRow
            icon={<SlidersHorizontal size={16} color={COLORS.textMuted} />}
            label="Tasas personalizadas"
            value={
              activeCustomCount > 0 ? `${activeCustomCount} activas` : 'Gestionar'
            }
            onPress={() => {
              triggerSelectionHaptic();
              router.push('/tools/custom-rate');
            }}
            isLast
          />
        </SettingsGroup>

        {/* Data */}
        <SettingsGroup
          title="Datos"
          icon={<Database size={16} color={COLORS.primary} />}
          index={5}
        >
          <SettingsRow
            icon={<RefreshCw size={16} color={COLORS.textMuted} />}
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
          index={5}
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

      <AppSheet
        visible={commerceSheetVisible}
        title="Comercio e impuestos"
        subtitle="Personaliza tus tickets y porcentajes fiscales"
        onClose={() => setCommerceSheetVisible(false)}
        footer={
          <Pressable
            onPress={saveCommerceSettings}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
            style={{
              backgroundColor: COLORS.primary,
              borderCurve: 'continuous',
            }}
          >
            <Check size={17} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-sm font-medium text-white">
              Guardar configuración
            </Text>
          </Pressable>
        }
      >
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">
              Nombre del negocio o emprendimiento (aparece en tickets)
            </Text>
            <TextInput
              value={draftBizName}
              onChangeText={setDraftBizName}
              placeholder="Ej. Bodega La Esquina, Mi Emprendimiento"
              placeholderTextColor={COLORS.textMuted}
              maxLength={40}
              className="rounded-xl border border-border bg-surface-elevated px-3.5"
              style={singleLineInputStyle({ color: COLORS.textPrimary })}
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                IVA (%)
              </Text>
              <View className="h-11 flex-row items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3.5">
                <TextInput
                  value={draftIva}
                  onChangeText={(txt) => {
                    if (commerceError) setCommerceError(null);
                    setDraftIva(txt.replace(/[^0-9.,]/g, ''));
                  }}
                  keyboardType="decimal-pad"
                  placeholder="16"
                  placeholderTextColor={COLORS.textMuted}
                  className="flex-1"
                  style={singleLineInputStyle({
                    color: COLORS.textPrimary,
                    weight: 'semibold',
                    tabularNums: true,
                  })}
                />
                <ClearInputButton
                  visible={draftIva.length > 0}
                  onPress={() => {
                    if (commerceError) setCommerceError(null);
                    setDraftIva('');
                  }}
                />
              </View>
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                IGTF (%)
              </Text>
              <View className="h-11 flex-row items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3.5">
                <TextInput
                  value={draftIgtf}
                  onChangeText={(txt) => {
                    if (commerceError) setCommerceError(null);
                    setDraftIgtf(txt.replace(/[^0-9.,]/g, ''));
                  }}
                  keyboardType="decimal-pad"
                  placeholder="3"
                  placeholderTextColor={COLORS.textMuted}
                  className="flex-1"
                  style={singleLineInputStyle({
                    color: COLORS.textPrimary,
                    weight: 'semibold',
                    tabularNums: true,
                  })}
                />
                <ClearInputButton
                  visible={draftIgtf.length > 0}
                  onPress={() => {
                    if (commerceError) setCommerceError(null);
                    setDraftIgtf('');
                  }}
                />
              </View>
            </View>
          </View>

          {commerceError ? (
            <Text className="text-xs font-medium text-danger">
              {commerceError}
            </Text>
          ) : null}
        </View>
      </AppSheet>
    </View>
  );
}
