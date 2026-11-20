import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  CurrencyCode,
  FiscalSettings,
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
  /** Configurable fiscal tax percentages (IVA & IGTF) */
  fiscalSettings: FiscalSettings;
  /** Optional business name rendered on shared shopping tickets */
  businessName: string;

  setSelectedCurrency: (code: CurrencyCode) => void;
  setAmount: (value: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColorId) => void;
  completeOnboarding: () => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setFiscalSettings: (settings: Partial<FiscalSettings>) => void;
  setBusinessName: (name: string) => void;
}

const DEFAULT_FISCAL_SETTINGS: FiscalSettings = {
  ivaPercent: 16,
  igtfPercent: 3,
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      selectedCurrency: 'USD',
      amount: '1',
      themeMode: 'system',
      primaryColor: 'orange',
      hasCompletedOnboarding: false,
      hapticsEnabled: true,
      fiscalSettings: DEFAULT_FISCAL_SETTINGS,
      businessName: '',

      setSelectedCurrency: (code) => set({ selectedCurrency: code }),
      setAmount: (value) => set({ amount: value }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setFiscalSettings: (partial) =>
        set((state) => ({
          fiscalSettings: {
            ivaPercent:
              typeof partial.ivaPercent === 'number' && partial.ivaPercent >= 0
                ? partial.ivaPercent
                : state.fiscalSettings.ivaPercent,
            igtfPercent:
              typeof partial.igtfPercent === 'number' && partial.igtfPercent >= 0
                ? partial.igtfPercent
                : state.fiscalSettings.igtfPercent,
          },
        })),
      setBusinessName: (name) => set({ businessName: name }),
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
        fiscalSettings: state.fiscalSettings,
        businessName: state.businessName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (state.primaryColor as string) === 'teal') {
          state.setPrimaryColor('gold');
        }
      },
    },
  ),
);
