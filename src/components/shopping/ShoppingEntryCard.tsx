import { ArrowRight, ListChecks, Plus, ShoppingCart } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ShoppingList } from '@/types/currency.types';
import {
  triggerImpactHaptic,
  triggerSelectionHaptic,
} from '@/utils/haptics';
import {
  evaluateBudget,
  formatShoppingMoney,
  getListTotals,
} from '@/utils/shoppingUtils';

interface ShoppingEntryCardProps {
  activeList: ShoppingList | undefined;
  totalListsCount: number;
  onStartNew: () => void;
  onContinueActive: (listId: string) => void;
  onOpenAllLists: () => void;
}

export function ShoppingEntryCard({
  activeList,
  totalListsCount,
  onStartNew,
  onContinueActive,
  onOpenAllLists,
}: ShoppingEntryCardProps) {
  const COLORS = useThemeColors();

  const totals = activeList ? getListTotals(activeList) : null;
  const budget =
    activeList && totals
      ? evaluateBudget(
          totals,
          activeList.budgetLimit,
          activeList.budgetCurrency,
          activeList.displayCurrency,
          activeList.ratesSnapshot,
        )
      : null;

  const budgetColor =
    budget?.status === 'exceeded'
      ? COLORS.danger
      : budget?.status === 'warning'
        ? COLORS.primary
        : COLORS.success;

  return (
    <Card
      className="border"
      style={{
        borderColor: activeList ? `${COLORS.primary}55` : COLORS.border,
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2.5">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${COLORS.primary}1A`,
              borderCurve: 'continuous',
            }}
          >
            <ShoppingCart size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text className="text-sm font-semibold text-text-primary">
              Calculadora de Compras
            </Text>
            <Text className="text-xs text-text-muted">
              {activeList
                ? `${activeList.title} • ${activeList.items.length} ${
                    activeList.items.length === 1 ? 'producto' : 'productos'
                  }`
                : 'Suma productos en divisas y controla tu límite'}
            </Text>
          </View>
        </View>

        {activeList ? (
          <View
            className="rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: `${COLORS.primary}1A` }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: COLORS.primary }}
            >
              En curso
            </Text>
          </View>
        ) : null}
      </View>

      {activeList && totals ? (
        <View className="mt-3 rounded-xl bg-surface-elevated p-3">
          <View className="flex-row items-baseline justify-between">
            <Text
              className="text-lg font-bold text-text-primary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatShoppingMoney(
                totals[activeList.displayCurrency],
                activeList.displayCurrency,
              )}
            </Text>
            <Text
              className="text-xs font-medium text-text-secondary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {activeList.displayCurrency === 'VES'
                ? formatShoppingMoney(totals.USD, 'USD')
                : formatShoppingMoney(totals.VES, 'VES')}
            </Text>
          </View>

          {budget?.hasBudget && (
            <View className="mt-2 gap-1">
              <View
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: COLORS.border }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(4, budget.percentageUsed))}%`,
                    backgroundColor: budgetColor,
                  }}
                />
              </View>
              <Text
                className="text-[11px] font-medium mt-0.5"
                style={{ color: budgetColor }}
              >
                {budget.status === 'exceeded'
                  ? `Excedido por ${formatShoppingMoney(
                      Math.abs(budget.remainingInDisplay),
                      activeList.displayCurrency,
                    )}`
                  : `Disponible: ${formatShoppingMoney(
                      budget.remainingInDisplay,
                      activeList.displayCurrency,
                    )}`}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      <View className="mt-3 flex-row gap-2.5">
        <Pressable
          onPress={() => {
            triggerImpactHaptic('light');
            if (activeList) {
              onContinueActive(activeList.id);
            } else {
              onStartNew();
            }
          }}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 active:opacity-85"
          style={{
            backgroundColor: COLORS.primary,
            borderCurve: 'continuous',
          }}
        >
          {activeList ? (
            <ArrowRight size={15} color="#ffffff" strokeWidth={2.4} />
          ) : (
            <Plus size={15} color="#ffffff" strokeWidth={2.5} />
          )}
          <Text className="text-xs font-medium text-white">
            {activeList ? 'Continuar compra' : 'Nueva compra'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerSelectionHaptic();
            onOpenAllLists();
          }}
          className="flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 active:opacity-80"
          style={{ borderCurve: 'continuous' }}
        >
          <ListChecks size={15} color={COLORS.textPrimary} />
          <Text className="text-xs font-medium text-text-primary">
            Mis listas{totalListsCount > 0 ? ` (${totalListsCount})` : ''}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
