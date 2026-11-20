import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  BillSplit,
  CurrencyCode,
  EffectiveRatesSnapshot,
  RateSourceId,
  SplitPerson,
  SplitTipMode,
} from '@/types/currency.types';

const MAX_SAVED_SPLITS = 30;

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildDefaultPeople(count: number): SplitPerson[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: createId(`p${i + 1}`),
    name: `Persona ${i + 1}`,
    paid: false,
  }));
}

interface CreateSplitPayload {
  title?: string;
  total?: number;
  currency?: CurrencyCode;
  peopleCount?: number;
  tipMode?: SplitTipMode;
  tipValue?: number;
  rateSource?: RateSourceId;
  ratesSnapshot: EffectiveRatesSnapshot;
}

interface BillSplitState {
  splits: BillSplit[];
  createSplit: (payload: CreateSplitPayload) => string;
  updateSplitMeta: (
    splitId: string,
    patch: Partial<
      Pick<
        BillSplit,
        | 'title'
        | 'total'
        | 'currency'
        | 'tipMode'
        | 'tipValue'
        | 'rateSource'
        | 'ratesSnapshot'
      >
    >,
  ) => void;
  setPeopleCount: (splitId: string, count: number) => void;
  updatePerson: (
    splitId: string,
    personId: string,
    patch: Partial<Pick<SplitPerson, 'name' | 'customAmount'>>,
  ) => void;
  clearCustomAmounts: (splitId: string) => void;
  togglePersonPaid: (splitId: string, personId: string) => void;
  deleteSplit: (splitId: string) => void;
}

function updateSplitById(
  splits: BillSplit[],
  splitId: string,
  updater: (split: BillSplit) => BillSplit,
): BillSplit[] {
  return splits.map((item) => (item.id === splitId ? updater(item) : item));
}

export const useBillSplitStore = create<BillSplitState>()(
  persist(
    (set) => ({
      splits: [],

      createSplit: ({
        title,
        total = 0,
        currency = 'USD',
        peopleCount = 2,
        tipMode = 'none',
        tipValue = 0,
        rateSource = 'BCV_USD',
        ratesSnapshot,
      }) => {
        const id = createId('sp');
        const now = new Date().toISOString();
        const next: BillSplit = {
          id,
          title: title?.trim() || 'Cuenta compartida',
          createdAt: now,
          updatedAt: now,
          total,
          currency,
          tipMode,
          tipValue,
          rateSource,
          ratesSnapshot,
          people: buildDefaultPeople(peopleCount),
        };
        set((state) => ({
          splits: [next, ...state.splits].slice(0, MAX_SAVED_SPLITS),
        }));
        return id;
      },

      updateSplitMeta: (splitId, patch) => {
        const now = new Date().toISOString();
        set((state) => ({
          splits: updateSplitById(state.splits, splitId, (item) => ({
            ...item,
            ...patch,
            title:
              patch.title !== undefined
                ? patch.title.trim() || item.title
                : item.title,
            updatedAt: now,
          })),
        }));
      },

      setPeopleCount: (splitId, nextCount) => {
        const safeCount = Math.min(30, Math.max(1, Math.round(nextCount)));
        const now = new Date().toISOString();
        set((state) => ({
          splits: updateSplitById(state.splits, splitId, (item) => {
            const current = item.people;
            if (safeCount === current.length) return item;
            if (safeCount < current.length) {
              return {
                ...item,
                people: current.slice(0, safeCount),
                updatedAt: now,
              };
            }
            const extra: SplitPerson[] = Array.from(
              { length: safeCount - current.length },
              (_, idx) => ({
                id: createId(`p${current.length + idx + 1}`),
                name: `Persona ${current.length + idx + 1}`,
                paid: false,
              }),
            );
            return {
              ...item,
              people: [...current, ...extra],
              updatedAt: now,
            };
          }),
        }));
      },

      updatePerson: (splitId, personId, patch) => {
        const now = new Date().toISOString();
        set((state) => ({
          splits: updateSplitById(state.splits, splitId, (item) => ({
            ...item,
            updatedAt: now,
            people: item.people.map((person) =>
              person.id === personId
                ? {
                    ...person,
                    ...patch,
                    name:
                      patch.name !== undefined
                        ? patch.name.trim() || person.name
                        : person.name,
                  }
                : person,
            ),
          })),
        }));
      },

      clearCustomAmounts: (splitId) => {
        const now = new Date().toISOString();
        set((state) => ({
          splits: updateSplitById(state.splits, splitId, (item) => ({
            ...item,
            updatedAt: now,
            people: item.people.map(({ customAmount: _, ...person }) => person),
          })),
        }));
      },

      togglePersonPaid: (splitId, personId) => {
        const now = new Date().toISOString();
        set((state) => ({
          splits: updateSplitById(state.splits, splitId, (item) => ({
            ...item,
            updatedAt: now,
            people: item.people.map((person) =>
              person.id === personId
                ? {
                    ...person,
                    paid: !person.paid,
                    paidAt: !person.paid ? now : undefined,
                  }
                : person,
            ),
          })),
        }));
      },

      deleteSplit: (splitId) => {
        set((state) => ({
          splits: state.splits.filter((item) => item.id !== splitId),
        }));
      },
    }),
    {
      name: 'ratesvenapp_bill_splits',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
