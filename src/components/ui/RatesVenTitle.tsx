import { Image, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

const APP_LOGO = require('@/assets/images/logo.webp');

export type RatesVenTitleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type RatesVenTitleVariant = 'hero' | 'light' | 'dark';

interface SizeSpec {
  logo: number;
  text: number;
  badgeText: number;
  badgePx: number;
  badgePy: number;
  badgeRadius: number;
  gap: number;
}

const SIZE_SPECS: Record<RatesVenTitleSize, SizeSpec> = {
  xs: {
    logo: 18,
    text: 12,
    badgeText: 10,
    badgePx: 4,
    badgePy: 0,
    badgeRadius: 5,
    gap: 4,
  },
  sm: {
    logo: 24,
    text: 16,
    badgeText: 11,
    badgePx: 5,
    badgePy: 0,
    badgeRadius: 6,
    gap: 4,
  },
  md: {
    logo: 32,
    text: 20,
    badgeText: 14,
    badgePx: 6,
    badgePy: 0,
    badgeRadius: 7,
    gap: 5,
  },
  lg: {
    logo: 42,
    text: 30,
    badgeText: 18,
    badgePx: 6,
    badgePy: 0,
    badgeRadius: 8,
    gap: 6,
  },
  xl: {
    logo: 48,
    text: 34,
    badgeText: 20,
    badgePx: 8,
    badgePy: 1,
    badgeRadius: 9,
    gap: 6,
  },
};

interface RatesVenTitleProps {
  size?: RatesVenTitleSize;
  showLogo?: boolean;
  variant?: RatesVenTitleVariant;
  textColor?: string;
}

export function RatesVenTitle({
  size = 'lg',
  showLogo = false,
  variant = 'hero',
  textColor,
}: RatesVenTitleProps) {
  const COLORS = useThemeColors();
  const spec = SIZE_SPECS[size];

  const isHero = variant === 'hero';
  const ratesColor =
    textColor ??
    (isHero ? '#ffffff' : variant === 'dark' ? '#f8fafc' : '#0f172a');

  return (
    <View className="flex-row items-center" style={{ gap: spec.gap }}>
      {showLogo && (
        <Image
          source={APP_LOGO}
          style={{ width: spec.logo, height: spec.logo }}
          resizeMode="contain"
        />
      )}
      <Text
        className="font-bold"
        style={{
          fontSize: spec.text,
          color: ratesColor,
          includeFontPadding: false,
        }}
        numberOfLines={1}
      >
        Rates
      </Text>
      <View
        style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: spec.badgePx,
          paddingVertical: spec.badgePy,
          borderRadius: spec.badgeRadius,
          borderWidth: variant === 'light' ? 1 : 0,
          borderColor: COLORS.border,
          borderCurve: 'continuous',
        }}
      >
        <Text
          className="font-bold tracking-wide"
          style={{
            fontSize: spec.badgeText,
            includeFontPadding: false,
          }}
        >
          <Text style={{ color: '#FFCC00' }}>V</Text>
          <Text style={{ color: '#0d3fbd' }}>E</Text>
          <Text style={{ color: '#CF142B' }}>N</Text>
        </Text>
      </View>
    </View>
  );
}
