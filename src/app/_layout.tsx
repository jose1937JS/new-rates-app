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

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { AnimatedSplashOverlay } from '@/components/ui/AnimatedSplashOverlay';
import { SheetHost } from '@/components/ui/SheetHost';
import { Toast } from '@/components/ui/Toast';
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
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
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
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [splashDone, setSplashDone] = useState(false);
  const [storeHydrated, setStoreHydrated] = useState(() =>
    useCurrencyStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useCurrencyStore.persist.hasHydrated()) {
      setStoreHydrated(true);
      return;
    }
    const unsubscribe = useCurrencyStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return unsubscribe;
  }, []);

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
  const hasCompletedOnboarding = useCurrencyStore(
    (state) => state.hasCompletedOnboarding,
  );
  const completeOnboarding = useCurrencyStore(
    (state) => state.completeOnboarding,
  );

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
          {!storeHydrated ? null : !hasCompletedOnboarding ? (
            <OnboardingScreen onComplete={completeOnboarding} />
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.surface },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="shopping/[id]" />
              <Stack.Screen name="tools/custom-rate" />
              <Stack.Screen name="tools/mixed-payment" />
              <Stack.Screen name="tools/payments" />
              <Stack.Screen name="tools/payments/[id]" />
              <Stack.Screen name="tools/split" />
              <Stack.Screen name="tools/split/[id]" />
              <Stack.Screen name="tools/share-rates" />
            </Stack>
          )}
          <SheetHost />
        </PersistQueryClientProvider>

        <Toast />

        {!splashDone && (
          <AnimatedSplashOverlay
            isReady={fontsLoaded && storeHydrated}
            onFinish={() => setSplashDone(true)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
