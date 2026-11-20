import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { CurrencyCode } from '@/types/currency.types';

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT', 'VES'];

interface CurrencyChipRowProps {
  selected: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  variant?: 'default' | 'hero';
  currencies?: CurrencyCode[];
}

export function CurrencyChipRow({
  selected,
  onSelect,
  variant = 'default',
  currencies = CURRENCIES,
}: CurrencyChipRowProps) {
  return (
    <SegmentedControl
      options={currencies.map((code) => ({
        id: code,
        label: code,
        icon: <CurrencyIcon currency={code} size={13} />,
      }))}
      selected={selected}
      onSelect={onSelect}
      variant={variant}
      compact
    />
  );
}
