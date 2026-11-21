import { useRouter } from 'expo-router';
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListSettingsModal } from '@/components/shopping/BudgetProgressCard';
import { AppModal } from '@/components/ui/AppModal';
import { Card } from '@/components/ui/Card';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useShoppingStore } from '@/store/shoppingStore';
import type { ShoppingList } from '@/types/currency.types';
import { formatFullDateTime } from '@/utils/formatters';
import {
  triggerImpactHaptic,
  triggerSelectionHaptic,
} from '@/utils/haptics';
import {
  compareActualPaid,
  evaluateBudget,
  formatShoppingMoney,
  getListTotals,
  snapshotFromUnifiedRates,
} from '@/utils/shoppingUtils';

export default function ShoppingTabScreen() {
  const router = useRouter();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { rates } = useCurrencyRates();
  const { lists, createList, deleteList } = useShoppingStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShoppingList | null>(null);

  const activeLists = lists.filter((l) => l.status === 'active');
  const completedLists = lists.filter((l) => l.status === 'completed');

  const handleCreateList = (payload: {
    title: string;
    budgetLimit: number | null;
    budgetCurrency: ShoppingList['budgetCurrency'];
  }) => {
    const newId = createList({
      title: payload.title,
      budgetLimit: payload.budgetLimit ?? undefined,
      budgetCurrency: payload.budgetCurrency,
      displayCurrency: 'VES',
      defaultInputCurrency: 'USD',
      ratesSnapshot: snapshotFromUnifiedRates(rates),
    });
    router.push({ pathname: '/shopping/[id]', params: { id: newId } });
  };

  const renderListCard = (list: ShoppingList, index: number) => {
    const totals = getListTotals(list);
    const isActive = list.status === 'active';
    const budget = evaluateBudget(
      totals,
      list.budgetLimit,
      list.budgetCurrency,
      list.displayCurrency,
      list.ratesSnapshot,
    );
    const actualComparison = compareActualPaid(
      totals,
      list.actualPaidAmount,
      list.actualPaidCurrency,
      list.displayCurrency,
      list.ratesSnapshot,
    );

    const secondaryCurrency = list.displayCurrency === 'VES' ? 'USD' : 'VES';

    return (
      <Animated.View
        key={list.id}
        entering={FadeInDown.delay(index * 45).duration(300)}
      >
        <Pressable
          onPress={() => {
            triggerSelectionHaptic();
            router.push({ pathname: '/shopping/[id]', params: { id: list.id } });
          }}
          className="active:opacity-85"
        >
          <Card>
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text
                    className="text-base font-semibold text-text-primary"
                    numberOfLines={1}
                  >
                    {list.title}
                  </Text>
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: isActive
                        ? `${COLORS.primary}1A`
                        : `${COLORS.success}1A`,
                    }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{
                        color: isActive ? COLORS.primary : COLORS.success,
                      }}
                    >
                      {isActive ? 'En curso' : 'Finalizada'}
                    </Text>
                  </View>
                </View>

                <Text className="text-xs text-text-muted">
                  {formatFullDateTime(list.completedAt ?? list.createdAt)} •{' '}
                  {list.items.length}{' '}
                  {list.items.length === 1 ? 'producto' : 'productos'}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerSelectionHaptic();
                  setDeleteTarget(list);
                }}
                hitSlop={8}
                className="rounded-lg bg-danger/10 p-1.5 active:opacity-75"
              >
                <Trash2 size={14} color={COLORS.danger} />
              </Pressable>
            </View>

            {/* Totals & actual paid */}
            <View className="mt-3 flex-row items-baseline justify-between rounded-xl bg-surface-elevated px-3 py-2.5">
              <View>
                <Text className="text-[10px] text-text-muted">
                  Total calculado
                </Text>
                <Text
                  className="text-base font-semibold text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatShoppingMoney(
                    totals[list.displayCurrency],
                    list.displayCurrency,
                  )}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className="text-xs font-semibold text-text-secondary"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatShoppingMoney(
                    totals[secondaryCurrency],
                    secondaryCurrency,
                  )}
                </Text>
                {budget.hasBudget && (
                  <Text
                    className="mt-0.5 text-[10px] font-medium"
                    style={{
                      color:
                        budget.status === 'exceeded'
                          ? COLORS.danger
                          : COLORS.textMuted,
                    }}
                  >
                    Límite:{' '}
                    {formatShoppingMoney(
                      budget.limitInDisplay,
                      list.displayCurrency,
                    )}
                  </Text>
                )}
              </View>
            </View>

            {actualComparison.hasActualPaid && (
              <View className="mt-2 flex-row items-center justify-between px-1">
                <View className="flex-row items-center gap-1.5">
                  <Receipt size={13} color={COLORS.primary} />
                  <Text className="text-xs font-medium text-text-secondary">
                    Real cobrado:
                  </Text>
                  <Text
                    className="text-xs font-semibold text-text-primary"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatShoppingMoney(
                      actualComparison.actualInDisplay,
                      list.displayCurrency,
                    )}
                  </Text>
                </View>

                <Text
                  className="text-[11px] font-semibold"
                  style={{
                    color:
                      actualComparison.state === 'over'
                        ? COLORS.danger
                        : COLORS.success,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {actualComparison.state === 'exact'
                    ? 'Exacto'
                    : `${
                        actualComparison.diffInDisplay > 0 ? '+' : '-'
                      }${formatShoppingMoney(
                        Math.abs(actualComparison.diffInDisplay),
                        list.displayCurrency,
                      )}`}
                </Text>
              </View>
            )}

            <View className="mt-2.5 flex-row items-center justify-end gap-1">
              <Text
                className="text-xs font-medium"
                style={{ color: COLORS.primary }}
              >
                {isActive ? 'Continuar calculando' : 'Ver detalle'}
              </Text>
              <ArrowRight size={13} color={COLORS.primary} />
            </View>
          </Card>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-surface" style={{ backgroundColor: COLORS.surface }}>
      <ScreenHero
        title="Mis Compras"
        subtitle="Calculadora de mercado y cuentas"
        icon={<ShoppingCart size={20} color="#ffffff" />}
        rightElement={
          <Pressable
            onPress={() => {
              triggerSelectionHaptic();
              setShowCreateModal(true);
            }}
            className="flex-row items-center gap-1 rounded-xl bg-white px-3 py-2 active:opacity-85"
            style={{ borderCurve: 'continuous' }}
          >
            <Plus size={15} color={COLORS.primary} strokeWidth={2.5} />
            <Text
              className="text-xs font-medium"
              style={{ color: COLORS.primary }}
            >
              Nueva
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 104 + insets.bottom,
          gap: 14,
        }}
        contentInsetAdjustmentBehavior="never"
      >
        {lists.length === 0 ? (
          <Card className="items-center py-10">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${COLORS.primary}1A`,
                borderCurve: 'continuous',
              }}
            >
              <ShoppingCart size={30} color={COLORS.primary} />
            </View>
            <Text className="text-center text-base font-semibold text-text-primary">
              Aún no tienes listas de compras
            </Text>
            <Text className="mt-1.5 max-w-[270px] text-center text-xs leading-5 text-text-secondary">
              Crea una lista, fija un límite si lo deseas y ve sumando productos en dólares o bolívares sin pasarte en caja.
            </Text>
            <Pressable
              onPress={() => {
                triggerImpactHaptic('light');
                setShowCreateModal(true);
              }}
              className="mt-5 flex-row items-center gap-2 rounded-2xl px-6 py-3 active:opacity-85"
              style={{
                backgroundColor: COLORS.primary,
                borderCurve: 'continuous',
              }}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-sm font-medium text-white">
                Crear primera compra
              </Text>
            </Pressable>
          </Card>
        ) : (
          <>
            {activeLists.length > 0 && (
              <View className="gap-2.5">
                <View className="flex-row items-center gap-1.5 px-1">
                  <ShoppingBag size={15} color={COLORS.primary} />
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: COLORS.primary }}
                  >
                    Compras en curso ({activeLists.length})
                  </Text>
                </View>
                {activeLists.map((list, idx) => renderListCard(list, idx))}
              </View>
            )}

            {completedLists.length > 0 && (
              <View className="gap-2.5">
                <View className="flex-row items-center gap-1.5 px-1 pt-1">
                  <CheckCircle2 size={15} color={COLORS.success} />
                  <Text className="text-sm font-semibold text-text-primary">
                    Historial de compras ({completedLists.length})
                  </Text>
                </View>
                {completedLists.map((list, idx) =>
                  renderListCard(list, idx + activeLists.length),
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ListSettingsModal
        visible={showCreateModal}
        initialTitle=""
        initialBudgetCurrency="VES"
        confirmLabel="Empezar compra"
        onSave={handleCreateList}
        onClose={() => setShowCreateModal(false)}
      />

      <AppModal
        visible={deleteTarget !== null}
        title="Eliminar lista"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.title ?? ''}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (deleteTarget) {
            deleteList(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}
