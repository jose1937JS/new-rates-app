import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  CustomRateBase,
  CustomRateItem,
  CustomRateMode,
  CustomRateRounding,
} from '@/types/currency.types';

function createId(): string {
  return `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface SaveCustomRatePayload {
  emoji: string;
  label: string;
  enabled?: boolean;
  mode: CustomRateMode;
  fixedRate?: number;
  base: CustomRateBase;
  marginPercent: number;
  rounding: CustomRateRounding;
}

interface CustomRateState {
  customRates: CustomRateItem[];
  addCustomRate: (payload: SaveCustomRatePayload) => string;
  updateCustomRate: (id: string, payload: Partial<SaveCustomRatePayload>) => void;
  toggleCustomRate: (id: string) => void;
  deleteCustomRate: (id: string) => void;
}

export const useCustomRateStore = create<CustomRateState>()(
  persist(
    (set) => ({
      customRates: [],

      addCustomRate: (payload) => {
        const id = createId();
        const now = new Date().toISOString();
        const next: CustomRateItem = {
          id,
          emoji: payload.emoji || '🏪',
          label: payload.label.trim() || 'Tasa Comercio',
          enabled: payload.enabled ?? true,
          mode: payload.mode,
          fixedRate: payload.fixedRate,
          base: payload.base,
          marginPercent: payload.marginPercent,
          rounding: payload.rounding,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          customRates: [next, ...state.customRates],
        }));
        return id;
      },

      updateCustomRate: (id, payload) => {
        const now = new Date().toISOString();
        set((state) => ({
          customRates: state.customRates.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...payload,
                  label:
                    payload.label !== undefined
                      ? payload.label.trim() || item.label
                      : item.label,
                  emoji:
                    payload.emoji !== undefined
                      ? payload.emoji || item.emoji
                      : item.emoji,
                  updatedAt: now,
                }
              : item,
          ),
        }));
      },

      toggleCustomRate: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          customRates: state.customRates.map((item) =>
            item.id === id
              ? { ...item, enabled: !item.enabled, updatedAt: now }
              : item,
          ),
        }));
      },

      deleteCustomRate: (id) => {
        set((state) => ({
          customRates: state.customRates.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'ratesvenapp_custom_rates',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
