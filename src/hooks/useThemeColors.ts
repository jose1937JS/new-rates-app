import { useColorScheme as useNWColorScheme } from 'nativewind';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useCurrencyStore } from '@/store/currencyStore';
import { PRIMARY_COLOR_OPTIONS, THEME_COLORS } from '@/utils/constants';

export function useThemeColors() {
  const themeMode = useCurrencyStore((state) => state.themeMode);
  const primaryColorId = useCurrencyStore((state) => state.primaryColor);
  const { colorScheme: nwColorScheme } = useNWColorScheme();
  const rnColorScheme = useRNColorScheme();

  const isDark =
    themeMode === 'system'
      ? (nwColorScheme ?? rnColorScheme) === 'dark'
      : themeMode === 'dark';

  const palette = THEME_COLORS[isDark ? 'dark' : 'light'];
  const accent =
    PRIMARY_COLOR_OPTIONS.find((item) => item.id === primaryColorId) ??
    PRIMARY_COLOR_OPTIONS[0];

  const primary = isDark ? accent.primaryDark : accent.primary;
  const primaryLight = isDark ? accent.primary : accent.primaryLight;
  const primaryRgb = isDark ? accent.rgbDark : accent.rgb;
  const primaryLightRgb = isDark ? accent.rgb : accent.rgbLight;

  return {
    ...palette,
    primary,
    primaryLight,
    primaryDark: accent.primaryDark,
    primaryRgb,
    primaryLightRgb,
    primaryDarkRgb: accent.rgbDark,
    primaryColorId: accent.id,
    isDark,
    colorScheme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
    themeMode,
  };
}
