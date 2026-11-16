import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CurrencyCode, ThemeMode } from '@/types/currency.types';

interface CurrencyState {
  /** Currently selected currency in the main input */
  selectedCurrency: CurrencyCode;
  /** Raw amount string in the input */
  amount: string;
  /** Theme preference */
  themeMode: ThemeMode;

  setSelectedCurrency: (code: CurrencyCode) => void;
  setAmount: (value: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      selectedCurrency: 'USD',
      amount: '1',
      themeMode: 'system',

      setSelectedCurrency: (code) => set({ selectedCurrency: code }),
      setAmount: (value) => set({ amount: value }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'ratesvenapp_theme_store',
      storage: createJSONStorage(() => AsyncStorage),
      // Always boot with selectedCurrency = 'USD' and amount = '1'
      partialize: (state) => ({
        themeMode: state.themeMode,
      }),
    },
  ),
);
