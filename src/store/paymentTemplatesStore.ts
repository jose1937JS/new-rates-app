import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PaymentTemplate } from '@/types/currency.types';

function createId(): string {
  return `pt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

export type CreatePaymentTemplateInput = DistributiveOmit<
  PaymentTemplate,
  'id' | 'createdAt' | 'updatedAt'
>;

interface PaymentTemplatesState {
  templates: PaymentTemplate[];
  addTemplate: (input: CreatePaymentTemplateInput) => string;
  updateTemplate: (id: string, input: CreatePaymentTemplateInput) => void;
  toggleFavorite: (id: string) => void;
  deleteTemplate: (id: string) => void;
}

export const usePaymentTemplatesStore = create<PaymentTemplatesState>()(
  persist(
    (set) => ({
      templates: [],

      addTemplate: (input) => {
        const id = createId();
        const now = new Date().toISOString();
        const item: PaymentTemplate = {
          ...input,
          id,
          createdAt: now,
          updatedAt: now,
        } as PaymentTemplate;
        set((state) => ({
          templates: [item, ...state.templates],
        }));
        return id;
      },

      updateTemplate: (id, input) => {
        const now = new Date().toISOString();
        set((state) => ({
          templates: state.templates.map((existing) =>
            existing.id === id
              ? ({
                  ...input,
                  id: existing.id,
                  isFavorite: existing.isFavorite,
                  createdAt: existing.createdAt,
                  updatedAt: now,
                } as PaymentTemplate)
              : existing,
          ),
        }));
      },

      toggleFavorite: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          templates: state.templates.map((item) =>
            item.id === id
              ? { ...item, isFavorite: !item.isFavorite, updatedAt: now }
              : item,
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'ratesvenapp_payment_templates',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
