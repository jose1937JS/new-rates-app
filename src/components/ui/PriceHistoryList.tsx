import { ArrowDownRight, ArrowUpRight, Calendar, Minus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { ChartDataPoint, CurrencyCode } from '@/types/currency.types';
import {
  formatChartTime,
  formatDayOfWeek,
  formatHistoryDate,
  formatNumber,
  formatPercentage,
} from '@/utils/formatters';

interface PriceHistoryListProps {
  data: ChartDataPoint[];
  currency: CurrencyCode;
}

interface ProcessedHistoryItem {
  key: string;
  date: string;
  formattedDate: string;
  subtitle: string;
  value: number;
  diff: number;
  changePct: number;
  hasPrev: boolean;
}

export function PriceHistoryList({ data, currency }: PriceHistoryListProps) {
  const COLORS = useThemeColors();

  const historyItems = useMemo<ProcessedHistoryItem[]>(() => {
    return data
      .map((item, index) => {
        const prevItem = index > 0 ? data[index - 1] : null;
        const diff = prevItem ? item.value - prevItem.value : 0;
        const changePct =
          prevItem && prevItem.value > 0 ? (diff / prevItem.value) * 100 : 0;

        const day = formatDayOfWeek(item.date);
        const time = currency === 'USDT' ? formatChartTime(item.date) : '';
        const subtitle =
          day && time ? `${day} • ${time}` : day || time;

        return {
          key: item.id !== undefined ? String(item.id) : `${item.date}-${index}`,
          date: item.date,
          formattedDate: formatHistoryDate(item.date),
          subtitle,
          value: item.value,
          diff,
          changePct,
          hasPrev: prevItem !== null,
        };
      })
      .reverse();
  }, [data, currency]);

  if (historyItems.length === 0) {
    return null;
  }

  return (
    <View
      className="rounded-2xl bg-surface-card p-4"
      style={{ borderCurve: 'continuous' }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border">
        <View className="flex-row items-center gap-2">
          <Calendar size={16} color={COLORS.primary} />
          <Text className="text-sm font-semibold text-text-primary">
            Registro de Precios
          </Text>
        </View>
        <View className="rounded-full bg-surface-elevated px-2.5 py-0.5 border border-border">
          <Text className="text-[11px] font-medium text-text-muted">
            {historyItems.length}{' '}
            {historyItems.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>
      </View>

      {/* List items */}
      <View className="pt-1">
        {historyItems.map((item, index) => {
          const isPositive = item.changePct > 0;
          const isNegative = item.changePct < 0;
          const isLast = index === historyItems.length - 1;

          return (
            <View
              key={item.key}
              className={`flex-row items-center justify-between py-2.5 ${
                !isLast ? 'border-b border-border/40' : ''
              }`}
            >
              {/* Date & Day/Time */}
              <View className="gap-0.5">
                <Text className="text-sm font-medium text-text-primary">
                  {item.formattedDate}
                </Text>
                {item.subtitle ? (
                  <Text className="text-xs text-text-muted">
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>

              {/* Price & Daily Change */}
              <View className="items-end gap-0.5">
                <Text
                  className="text-sm font-semibold text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}
                  selectable
                >
                  {formatNumber(item.value, 2)} VES
                </Text>

                {item.hasPrev ? (
                  <View className="flex-row items-center gap-0.5">
                    {isPositive ? (
                      <ArrowUpRight size={12} color={COLORS.success} />
                    ) : isNegative ? (
                      <ArrowDownRight size={12} color={COLORS.danger} />
                    ) : (
                      <Minus size={12} color={COLORS.textMuted} />
                    )}
                    <Text
                      className={`text-xs font-medium ${
                        isPositive
                          ? 'text-success'
                          : isNegative
                            ? 'text-danger'
                            : 'text-text-muted'
                      }`}
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatPercentage(item.changePct)}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[11px] text-text-muted">
                    Base del período
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
