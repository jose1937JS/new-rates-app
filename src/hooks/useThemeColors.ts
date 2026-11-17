import { useColorScheme as useRNColorScheme } from 'react-native';

import { useCurrencyStore } from '@/store/currencyStore';
import { PRIMARY_COLOR_OPTIONS, THEME_COLORS } from '@/utils/constants';

export function useThemeColors() {
  const themeMode = useCurrencyStore((state) => state.themeMode);
  const primaryColorId = useCurrencyStore((state) => state.primaryColor);
  const systemColorScheme = useRNColorScheme();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const palette = THEME_COLORS[isDark ? 'dark' : 'light'];
  const accent =
    PRIMARY_COLOR_OPTIONS.find((item) => item.id === primaryColorId) ??
    PRIMARY_COLOR_OPTIONS[0];

  return {
    ...palette,
    primary: accent.primary,
    primaryLight: accent.primaryLight,
    primaryDark: accent.primaryDark,
    primaryRgb: accent.rgb,
    primaryLightRgb: accent.rgbLight,
    primaryDarkRgb: accent.rgbDark,
    primaryColorId: accent.id,
    isDark,
    colorScheme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
    themeMode,
  };
}
