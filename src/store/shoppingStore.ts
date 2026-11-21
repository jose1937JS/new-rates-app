import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  CurrencyCode,
  ShoppingItem,
  ShoppingList,
  ShoppingRatesSnapshot,
} from '@/types/currency.types';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface CreateListPayload {
  title?: string;
  budgetLimit?: number;
  budgetCurrency?: CurrencyCode;
  displayCurrency?: CurrencyCode;
  defaultInputCurrency?: CurrencyCode;
  ratesSnapshot: ShoppingRatesSnapshot;
}

interface AddItemPayload {
  name?: string;
  unitPrice: number;
  currency: CurrencyCode;
  quantity: number;
}

interface UpdateListMetaPayload {
  title?: string;
  budgetLimit?: number | null;
  budgetCurrency?: CurrencyCode;
  displayCurrency?: CurrencyCode;
  defaultInputCurrency?: CurrencyCode;
  ratesSnapshot?: ShoppingRatesSnapshot;
}

interface ShoppingState {
  lists: ShoppingList[];
  createList: (payload: CreateListPayload) => string;
  updateListMeta: (listId: string, payload: UpdateListMetaPayload) => void;
  addItem: (listId: string, item: AddItemPayload) => void;
  updateItem: (listId: string, itemId: string, item: AddItemPayload) => void;
  removeItem: (listId: string, itemId: string) => void;
  adjustItemQuantity: (listId: string, itemId: string, delta: number) => void;
  setActualPaid: (
    listId: string,
    amount: number | undefined,
    currency: CurrencyCode,
  ) => void;
  completeList: (listId: string) => void;
  deleteList: (listId: string) => void;
}

function updateTargetList(
  lists: ShoppingList[],
  listId: string,
  updater: (list: ShoppingList) => ShoppingList,
): ShoppingList[] {
  return lists.map((list) => (list.id === listId ? updater(list) : list));
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: ({
        title,
        budgetLimit,
        budgetCurrency = 'VES',
        displayCurrency = 'VES',
        defaultInputCurrency = 'USD',
        ratesSnapshot,
      }) => {
        const now = new Date().toISOString();
        const existingCount = get().lists.length;
        const cleanTitle = title?.trim() || `Compra #${existingCount + 1}`;
        const id = createId();

        const newList: ShoppingList = {
          id,
          title: cleanTitle,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          displayCurrency,
          defaultInputCurrency,
          budgetLimit: budgetLimit && budgetLimit > 0 ? budgetLimit : undefined,
          budgetCurrency,
          actualPaidCurrency: displayCurrency,
          ratesSnapshot,
          items: [],
        };

        set((state) => ({ lists: [newList, ...state.lists] }));
        return id;
      },

      updateListMeta: (listId, payload) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => {
            if (list.status === 'completed') {
              if (
                payload.displayCurrency &&
                payload.displayCurrency !== list.displayCurrency
              ) {
                return { ...list, displayCurrency: payload.displayCurrency };
              }
              return list;
            }
            return {
              ...list,
              title:
                payload.title !== undefined
                  ? payload.title.trim() || list.title
                  : list.title,
              budgetLimit:
                payload.budgetLimit === null
                  ? undefined
                  : payload.budgetLimit !== undefined
                    ? payload.budgetLimit > 0
                      ? payload.budgetLimit
                      : undefined
                    : list.budgetLimit,
              budgetCurrency: payload.budgetCurrency ?? list.budgetCurrency,
              displayCurrency: payload.displayCurrency ?? list.displayCurrency,
              defaultInputCurrency:
                payload.defaultInputCurrency ?? list.defaultInputCurrency,
              ratesSnapshot: payload.ratesSnapshot ?? list.ratesSnapshot,
              updatedAt: now,
            };
          }),
        }));
      },

      addItem: (listId, payload) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => {
            if (list.status === 'completed') return list;
            const cleanName =
              payload.name?.trim() || `Producto #${list.items.length + 1}`;
            const newItem: ShoppingItem = {
              id: createId(),
              name: cleanName,
              unitPrice: payload.unitPrice,
              currency: payload.currency,
              quantity: payload.quantity > 0 ? payload.quantity : 1,
              createdAt: now,
            };
            return {
              ...list,
              defaultInputCurrency: payload.currency,
              updatedAt: now,
              items: [newItem, ...list.items],
            };
          }),
        }));
      },

      updateItem: (listId, itemId, payload) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => {
            if (list.status === 'completed') return list;
            return {
              ...list,
              updatedAt: now,
              items: list.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      name: payload.name?.trim() || item.name,
                      unitPrice: payload.unitPrice,
                      currency: payload.currency,
                      quantity: payload.quantity > 0 ? payload.quantity : 1,
                    }
                  : item,
              ),
            };
          }),
        }));
      },

      removeItem: (listId, itemId) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => {
            if (list.status === 'completed') return list;
            return {
              ...list,
              updatedAt: now,
              items: list.items.filter((item) => item.id !== itemId),
            };
          }),
        }));
      },

      adjustItemQuantity: (listId, itemId, delta) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => {
            if (list.status === 'completed') return list;
            return {
              ...list,
              updatedAt: now,
              items: list.items.map((item) => {
                if (item.id !== itemId) return item;
                const nextQty = Math.round((item.quantity + delta) * 100) / 100;
                return {
                  ...item,
                  quantity: Math.max(delta < 0 ? 1 : 0.01, nextQty),
                };
              }),
            };
          }),
        }));
      },

      setActualPaid: (listId, amount, currency) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => {
            if (list.status === 'completed') return list;
            return {
              ...list,
              actualPaidAmount: amount && amount > 0 ? amount : undefined,
              actualPaidCurrency: currency,
              updatedAt: now,
            };
          }),
        }));
      },

      completeList: (listId) => {
        const now = new Date().toISOString();
        set((state) => ({
          lists: updateTargetList(state.lists, listId, (list) => ({
            ...list,
            status: 'completed',
            completedAt: now,
            updatedAt: now,
          })),
        }));
      },

      deleteList: (listId) => {
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== listId),
        }));
      },
    }),
    {
      name: 'ratesvenapp_shopping_lists',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
