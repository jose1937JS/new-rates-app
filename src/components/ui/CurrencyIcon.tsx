import { Image, Text } from 'react-native';

import type { CurrencyCode } from '@/types/currency.types';
import { CURRENCY_FLAGS } from '@/utils/constants';

const USDT_ICON = require('@/assets/images/usdt-icon.png');

interface CurrencyIconProps {
  currency: CurrencyCode;
  size?: number;
}

export function CurrencyIcon({ currency, size = 20 }: CurrencyIconProps) {
  if (currency === 'USDT') {
    return (
      <Image
        source={USDT_ICON}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="USDT"
      />
    );
  }

  return (
    <Text style={{ fontSize: size, lineHeight: Math.round(size * 1.2) }}>
      {CURRENCY_FLAGS[currency]}
    </Text>
  );
}
