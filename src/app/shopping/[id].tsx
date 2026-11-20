import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Receipt,
  Settings2,
  ShoppingBasket,
  Trash2
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActualPaidCard } from '@/components/shopping/ActualPaidCard';
import {
  BudgetProgressBar,
  ListSettingsModal,
} from '@/components/shopping/BudgetProgressCard';
import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { ProductFormCard } from '@/components/shopping/ProductFormCard';
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow';
import { AppModal } from '@/components/ui/AppModal';
import { Card } from '@/components/ui/Card';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useShoppingStore } from '@/store/shoppingStore';
import type { CurrencyCode, ShoppingItem } from '@/types/currency.types';
import { formatFullDateTime, formatNumber } from '@/utils/formatters';
import {
  evaluateBudget,
  formatShoppingMoney,
  getListTotals,
  snapshotFromUnifiedRates,
} from '@/utils/shoppingUtils';

const ALL_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'USDT', 'VES'];

export default function ShoppingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();
  const { rates } = useCurrencyRates();

  const list = useShoppingStore((state) =>
    state.lists.find((item) => item.id === id),
  );
  const {
    updateListMeta,
    addItem,
    updateItem,
    removeItem,
    adjustItemQuantity,
    setActualPaid,
    completeList,
    reopenList,
    deleteList,
  } = useShoppingStore();

  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showListConfig, setShowListConfig] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync live rates if the active list was created before rates finished loading
  useEffect(() => {
    if (
      list &&
      list.status === 'active' &&
      list.ratesSnapshot.usdToVes === 0 &&
      rates &&
      rates.usd.rateToVes > 0
    ) {
      updateListMeta(list.id, {
        ratesSnapshot: snapshotFromUnifiedRates(rates),
      });
    }
  }, [list, rates, updateListMeta]);

  if (!list) {
    return (
      <View
        className="flex-1 bg-surface"
        style={{ backgroundColor: COLORS.surface }}
      >
        <ScreenHero
          title="Lista no encontrada"
          leftAction={
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
          }
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-text-secondary">
            Esta lista de compras ya no existe o fue eliminada.
          </Text>
          <Pressable
            onPress={() => router.replace('/shopping')}
            className="mt-4 rounded-xl px-5 py-3 active:opacity-85"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text className="text-sm font-bold text-white">Ir a Mis Compras</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isActive = list.status === 'active';
  const totals = getListTotals(list);
  const budget = evaluateBudget(
    totals,
    list.budgetLimit,
    list.budgetCurrency,
    list.displayCurrency,
    list.ratesSnapshot,
  );
  const otherCurrencies = ALL_CURRENCIES.filter(
    (c) => c !== list.displayCurrency,
  );

  const handleProductSubmit = (payload: {
    name: string;
    unitPrice: number;
    currency: CurrencyCode;
    quantity: number;
  }) => {
    if (editingItem) {
      updateItem(list.id, editingItem.id, payload);
      setEditingItem(null);
    } else {
      addItem(list.id, payload);
    }
  };

  const handleFinishList = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingItem(null);
    completeList(list.id);
  };

  const handleReopenList = () => {
    void Haptics.selectionAsync();
    reopenList(list.id);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Hero with Live Total, Currency Switcher & Budget Progress */}
      <ScreenHero
        title={list.title}
        subtitle={
          isActive
            ? `${list.items.length} ${
                list.items.length === 1 ? 'producto' : 'productos'
              } • En curso`
            : `Finalizada • ${formatFullDateTime(
                list.completedAt ?? list.updatedAt,
              )}`
        }
        leftAction={
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderCurve: 'continuous',
            }}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
        }
        rightElement={
          isActive ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setShowListConfig(true);
              }}
              hitSlop={8}
              className="flex-row items-center gap-1 rounded-xl px-2.5 py-2 active:opacity-80"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderCurve: 'continuous',
              }}
            >
              <Settings2 size={15} color="#ffffff" />
              <Text className="text-xs font-semibold text-white">Límite</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleReopenList}
              hitSlop={8}
              className="flex-row items-center gap-1 rounded-xl bg-white px-3 py-2 active:opacity-85"
              style={{ borderCurve: 'continuous' }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: COLORS.primary }}
              >
                Editar
              </Text>
            </Pressable>
          )
        }
      >
        {/* Display Currency Selector */}
        <CurrencyChipRow
          selected={list.displayCurrency}
          onSelect={(code) =>
            updateListMeta(list.id, { displayCurrency: code })
          }
          variant="hero"
        />

        {/* Grand Total + Multi-Currency Equivalents */}
        <View className="mt-4 flex-row items-end justify-between gap-2">
          <View className="flex-1">
            <Text className="text-[11px] font-medium text-white/80">
              Total en {list.displayCurrency}
            </Text>
            <Text
              className="text-3xl font-bold text-white"
              style={{ fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatShoppingMoney(
                totals[list.displayCurrency],
                list.displayCurrency,
              )}
            </Text>
          </View>
        </View>

        <View className="mb-3 mt-2 flex-row flex-wrap gap-2">
          {otherCurrencies.map((code) => (
            <Pressable
              key={code}
              onPress={() => {
                void Haptics.selectionAsync();
                updateListMeta(list.id, { displayCurrency: code });
              }}
              className="rounded-lg px-2 py-1 active:opacity-80"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
            >
              <Text
                className="text-[11px] font-semibold text-white"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatShoppingMoney(totals[code], code)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Budget Limit Progress */}
        <BudgetProgressBar
          budget={budget}
          displayCurrency={list.displayCurrency}
          editable={isActive}
          onEditPress={() => setShowListConfig(true)}
        />
      </ScreenHero>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: isActive
            ? 100 + insets.bottom
            : Math.max(insets.bottom, 16) + 28,
          gap: 14,
        }}
      >
        {isActive ? (
          <>
            {/* Quick Add / Edit Product Form */}
            <ProductFormCard
              defaultCurrency={list.defaultInputCurrency}
              displayCurrency={list.displayCurrency}
              ratesSnapshot={list.ratesSnapshot}
              editingItem={editingItem}
              onSubmit={handleProductSubmit}
              onCancelEdit={() => setEditingItem(null)}
            />

            {/* Items List */}
            <Card
              title="Productos agregados"
              icon={<ShoppingBasket size={16} color={COLORS.primary} />}
              headerRight={
                <Text className="text-xs font-semibold text-text-muted">
                  {list.items.length}{' '}
                  {list.items.length === 1 ? 'ítem' : 'ítems'}
                </Text>
              }
            >
              {list.items.length === 0 ? (
                <Text className="py-4 text-center text-xs text-text-muted">
                  Agrega tu primer producto arriba para empezar a calcular el total.
                </Text>
              ) : (
                list.items.map((item, idx) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    displayCurrency={list.displayCurrency}
                    ratesSnapshot={list.ratesSnapshot}
                    editable
                    isEditing={editingItem?.id === item.id}
                    isLast={idx === list.items.length - 1}
                    onAdjustQuantity={(delta) =>
                      adjustItemQuantity(list.id, item.id, delta)
                    }
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => {
                      if (editingItem?.id === item.id) {
                        setEditingItem(null);
                      }
                      removeItem(list.id, item.id);
                    }}
                  />
                ))
              )}
            </Card>
          </>
        ) : (
          <>
            {/* Actual Paid Price Card */}
            <ActualPaidCard
              totals={totals}
              displayCurrency={list.displayCurrency}
              actualPaidAmount={list.actualPaidAmount}
              actualPaidCurrency={list.actualPaidCurrency}
              ratesSnapshot={list.ratesSnapshot}
              onSaveActualPaid={(amount, currency) =>
                setActualPaid(list.id, amount, currency)
              }
            />

            {/* Completed Items Breakdown */}
            <Card
              title="Detalle de productos"
              icon={<Receipt size={16} color={COLORS.primary} />}
              headerRight={
                <Text className="text-xs font-semibold text-text-muted">
                  {list.items.length}{' '}
                  {list.items.length === 1 ? 'ítem' : 'ítems'}
                </Text>
              }
            >
              {list.items.length === 0 ? (
                <Text className="py-4 text-center text-xs text-text-muted">
                  Esta lista no tiene productos registrados.
                </Text>
              ) : (
                list.items.map((item, idx) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    displayCurrency={list.displayCurrency}
                    ratesSnapshot={list.ratesSnapshot}
                    isLast={idx === list.items.length - 1}
                  />
                ))
              )}
            </Card>

            {/* Rates Snapshot Info */}
            <View className="items-center gap-1 py-1">
              <Text className="text-[11px] text-text-muted">
                Tasas aplicadas en esta compra:
              </Text>
              <Text
                className="text-[11px] font-medium text-text-secondary"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                USD {formatNumber(list.ratesSnapshot.usdToVes, 2)} Bs • EUR{' '}
                {formatNumber(list.ratesSnapshot.eurToVes, 2)} Bs • USDT{' '}
                {formatNumber(list.ratesSnapshot.usdtToVes, 2)} Bs
              </Text>
            </View>

            {/* Delete Purchase Button */}
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setShowDeleteModal(true);
              }}
              className="flex-row items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 py-3.5 active:opacity-80"
              style={{ borderCurve: 'continuous' }}
            >
              <Trash2 size={16} color={COLORS.danger} />
              <Text className="text-sm font-semibold text-danger">
                Eliminar lista de compras
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Bar when actively shopping */}
      {isActive && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface-card px-4 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
            borderColor: COLORS.border,
          }}
        >
          <Pressable
            onPress={handleFinishList}
            disabled={list.items.length === 0}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
            style={{
              backgroundColor:
                list.items.length > 0 ? COLORS.primary : COLORS.surfaceElevated,
              borderCurve: 'continuous',
            }}
          >
            <CheckCircle2
              size={18}
              color={list.items.length > 0 ? '#ffffff' : COLORS.textMuted}
              strokeWidth={2.4}
            />
            <Text
              className="text-sm font-bold"
              style={{
                color: list.items.length > 0 ? '#ffffff' : COLORS.textMuted,
              }}
            >
              Finalizar y guardar compra
            </Text>
          </Pressable>
        </View>
      )}

      <ListSettingsModal
        visible={showListConfig}
        initialTitle={list.title}
        initialBudgetLimit={list.budgetLimit}
        initialBudgetCurrency={list.budgetCurrency}
        confirmLabel="Guardar cambios"
        onSave={(payload) => updateListMeta(list.id, payload)}
        onClose={() => setShowListConfig(false)}
      />

      <AppModal
        visible={showDeleteModal}
        title="Eliminar compra"
        message={`¿Seguro que deseas eliminar "${list.title}"?`}
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          deleteList(list.id);
          setShowDeleteModal(false);
          router.replace('/shopping');
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </KeyboardAvoidingView>
  );
}
