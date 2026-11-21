import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const COLORS = useThemeColors();

  return (
    <Tabs
      initialRouteName="index"
      detachInactiveScreens={false}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        freezeOnBlur: false,
        sceneStyle: {
          backgroundColor: COLORS.surface,
        },
      }}
    >
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarLabel: 'Historial',
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Compras',
          tabBarLabel: 'Compras',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Conversor',
          tabBarLabel: 'Conversor',
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Herramientas',
          tabBarLabel: 'Herramientas',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tabs>
  );
}
