import { create } from 'zustand';

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

export const useCurrencyStore = create<CurrencyState>((set) => ({
  selectedCurrency: 'VES',
  amount: '',
  themeMode: 'dark',

  setSelectedCurrency: (code) => set({ selectedCurrency: code }),
  setAmount: (value) => set({ amount: value }),
  setThemeMode: (mode) => set({ themeMode: mode }),
}));
