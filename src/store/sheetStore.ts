import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface SheetEntry {
  id: string;
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  scrollable?: boolean;
  footer?: ReactNode;
}

interface SheetState {
  sheets: SheetEntry[];
  upsertSheet: (entry: SheetEntry) => void;
  closeSheet: (id: string) => void;
  finishClose: (id: string) => void;
  removeSheet: (id: string) => void;
}

export const useSheetStore = create<SheetState>((set) => ({
  sheets: [],

  upsertSheet: (entry) =>
    set((state) => {
      const idx = state.sheets.findIndex((item) => item.id === entry.id);
      if (idx === -1) {
        return { sheets: [...state.sheets, entry] };
      }
      const next = [...state.sheets];
      next[idx] = entry;
      return { sheets: next };
    }),

  closeSheet: (id) =>
    set((state) => {
      const idx = state.sheets.findIndex((item) => item.id === id);
      if (idx === -1 || !state.sheets[idx].visible) {
        return state;
      }
      const next = [...state.sheets];
      next[idx] = { ...next[idx], visible: false };
      return { sheets: next };
    }),

  finishClose: (id) =>
    set((state) => {
      if (!state.sheets.some((item) => item.id === id && !item.visible)) {
        return state;
      }
      return {
        sheets: state.sheets.filter((item) => !(item.id === id && !item.visible)),
      };
    }),

  removeSheet: (id) =>
    set((state) => {
      if (!state.sheets.some((item) => item.id === id)) {
        return state;
      }
      return {
        sheets: state.sheets.filter((item) => item.id !== id),
      };
    }),
}));
