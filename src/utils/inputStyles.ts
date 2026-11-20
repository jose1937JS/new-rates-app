import type { TextStyle } from 'react-native';

type InputWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const FONT_BY_WEIGHT: Record<InputWeight, string> = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export function singleLineInputStyle({
  color,
  fontSize = 14,
  height = 44,
  weight = 'regular',
  tabularNums = false,
}: {
  color: string;
  fontSize?: number;
  height?: number;
  weight?: InputWeight;
  tabularNums?: boolean;
}): TextStyle {
  return {
    height,
    fontSize,
    fontFamily: FONT_BY_WEIGHT[weight],
    color,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    ...(tabularNums ? { fontVariant: ['tabular-nums'] } : {}),
  };
}
