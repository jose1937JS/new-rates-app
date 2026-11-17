import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme, vars } from 'nativewind';
import { useEffect, useState } from 'react';
import { LogBox, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/ui/AnimatedSplashOverlay';
import '@/global.css';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCurrencyStore } from '@/store/currencyStore';
import {
  GC_TIME,
  PERSIST_KEY,
  PERSIST_THROTTLE,
  STALE_TIME,
} from '@/utils/constants';

import {
  Poppins_100Thin,
  Poppins_100Thin_Italic,
  Poppins_200ExtraLight,
  Poppins_200ExtraLight_Italic,
  Poppins_300Light,
  Poppins_300Light_Italic,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black,
  Poppins_900Black_Italic,
  useFonts,
} from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 350, fade: true });

// Suppress Reanimated transform layout warning toast if triggered
LogBox.ignoreLogs([
  '[Reanimated] Property "transform"',
  'Property "transform" of AnimatedComponent',
]);

// Set default font family for React Native Text and TextInput components
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = { fontFamily: 'Poppins_400Regular' };

if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.style = { fontFamily: 'Poppins_400Regular' };

// Wire React Query onlineManager to NetInfo so offline fallback triggers cleanly
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
  }),
);

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_KEY,
  throttleTime: PERSIST_THROTTLE,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_100Thin,
    Poppins_100Thin_Italic,
    Poppins_200ExtraLight,
    Poppins_200ExtraLight_Italic,
    Poppins_300Light,
    Poppins_300Light_Italic,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_500Medium_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_800ExtraBold_Italic,
    Poppins_900Black,
    Poppins_900Black_Italic,
  });

  const [splashDone, setSplashDone] = useState(false);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: GC_TIME,
            staleTime: STALE_TIME,
            networkMode: 'offlineFirst',
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
            retry: 1,
          },
        },
      }),
  );

  const COLORS = useThemeColors();
  const { setColorScheme } = useColorScheme();
  const themeMode = useCurrencyStore((state) => state.themeMode);

  const primaryVars = vars({
    '--color-primary': COLORS.primaryRgb,
    '--color-primary-light': COLORS.primaryLightRgb,
    '--color-primary-dark': COLORS.primaryDarkRgb,
  });

  useEffect(() => {
    try {
      setColorScheme(themeMode);
    } catch {}
  }, [themeMode, setColorScheme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(COLORS.surface);
  }, [COLORS.surface]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <View style={[{ flex: 1, backgroundColor: COLORS.surface }, primaryVars]}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <StatusBar style={COLORS.isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.surface },
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PersistQueryClientProvider>

        {!splashDone && (
          <AnimatedSplashOverlay
            isReady={fontsLoaded}
            onFinish={() => setSplashDone(true)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
