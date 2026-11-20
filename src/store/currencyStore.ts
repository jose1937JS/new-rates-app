import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  CurrencyCode,
  PrimaryColorId,
  ThemeMode,
} from '@/types/currency.types';

interface CurrencyState {
  /** Currently selected currency in the main input */
  selectedCurrency: CurrencyCode;
  /** Raw amount string in the input */
  amount: string;
  /** Theme preference */
  themeMode: ThemeMode;
  /** User-selected primary accent color */
  primaryColor: PrimaryColorId;
  /** Whether the user has completed the initial onboarding flow */
  hasCompletedOnboarding: boolean;
  /** Whether tactile haptic feedback is enabled on touch interactions */
  hapticsEnabled: boolean;

  setSelectedCurrency: (code: CurrencyCode) => void;
  setAmount: (value: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColorId) => void;
  completeOnboarding: () => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      selectedCurrency: 'USD',
      amount: '1',
      themeMode: 'system',
      primaryColor: 'orange',
      hasCompletedOnboarding: false,
      hapticsEnabled: true,

      setSelectedCurrency: (code) => set({ selectedCurrency: code }),
      setAmount: (value) => set({ amount: value }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
    }),
    {
      name: 'ratesvenapp_theme_store',
      storage: createJSONStorage(() => AsyncStorage),
      // Always boot with selectedCurrency = 'USD' and amount = '1'
      partialize: (state) => ({
        themeMode: state.themeMode,
        primaryColor: state.primaryColor,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hapticsEnabled: state.hapticsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (state.primaryColor as string) === 'teal') {
          state.setPrimaryColor('gold');
        }
      },
    },
  ),
);
