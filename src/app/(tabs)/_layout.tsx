import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const COLORS = useThemeColors();

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
        name="index"
        options={{
          title: 'Conversor',
          tabBarLabel: 'Conversor',
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
