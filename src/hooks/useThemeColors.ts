import { useColorScheme as useRNColorScheme } from 'react-native';
import { useCurrencyStore } from '@/store/currencyStore';
import { THEME_COLORS } from '@/utils/constants';

export function useThemeColors() {
  const themeMode = useCurrencyStore((state) => state.themeMode);
  const systemColorScheme = useRNColorScheme();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const palette = THEME_COLORS[isDark ? 'dark' : 'light'];

  return {
    ...palette,
    isDark,
    colorScheme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
    themeMode,
  };
}
