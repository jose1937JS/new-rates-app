import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'error';

interface ToastState {
  id: number;
  visible: boolean;
  message: string;
  variant: ToastVariant;
  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
}

let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  id: 0,
  visible: false,
  message: '',
  variant: 'info',

  show: (message, variant = 'success') => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
    set((state) => ({
      id: state.id + 1,
      visible: true,
      message,
      variant,
    }));
    autoHideTimer = setTimeout(() => {
      set({ visible: false });
      autoHideTimer = null;
    }, 2200);
  },

  hide: () => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
    set({ visible: false });
  },
}));

/** Convenience helper callable from handlers without subscribing to store updates. */
export function showToast(message: string, variant: ToastVariant = 'success'): void {
  useToastStore.getState().show(message, variant);
}
