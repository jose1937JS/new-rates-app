import { Text } from 'react-native';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { RateSourceId } from '@/types/currency.types';
import type { RateSourceOption } from '@/utils/customRateUtils';
import { formatNumber } from '@/utils/formatters';

interface RateSourceSelectorProps {
  options: RateSourceOption[];
  selected: RateSourceId;
  onSelect: (id: RateSourceId) => void;
  showRates?: boolean;
}

export function RateSourceSelector({
  options,
  selected,
  onSelect,
  showRates = true,
}: RateSourceSelectorProps) {
  return (
    <SegmentedControl
      scrollable
      options={options.map((option) => ({
        id: option.id,
        label: option.shortLabel,
        icon: option.emoji ? <Text className="text-xs">{option.emoji}</Text> : undefined,
        badge:
          showRates && option.rateToVes > 0
            ? formatNumber(option.rateToVes, 2)
            : undefined,
      }))}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
