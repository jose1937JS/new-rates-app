import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { ArrowLeftRight, TrendingUp, Settings } from 'lucide-react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const COLORS = useThemeColors();
  const isIos = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          paddingTop: 5,
          height: isIos ? 65 : 75,
        },
        sceneStyle: {
          backgroundColor: COLORS.surface,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Conversor',
          tabBarLabel: 'Conversor',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
