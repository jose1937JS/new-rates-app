import { useId, useLayoutEffect, type ReactNode } from 'react';

import { useSheetStore } from '@/store/sheetStore';

interface AppSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  scrollable?: boolean;
  footer?: ReactNode;
}

export function AppSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  scrollable = true,
  footer,
}: AppSheetProps) {
  const id = useId();

  useLayoutEffect(() => {
    const store = useSheetStore.getState();
    if (!visible) {
      store.closeSheet(id);
      return;
    }

    store.upsertSheet({
      id,
      visible: true,
      title,
      subtitle,
      onClose,
      children,
      scrollable,
      footer,
    });
  }, [id, visible, title, subtitle, onClose, children, scrollable, footer]);

  useLayoutEffect(() => {
    return () => {
      useSheetStore.getState().removeSheet(id);
    };
  }, [id]);

  return null;
}
