import * as Haptics from 'expo-haptics';
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import type {
  CurrencyCode,
  ShoppingItem,
  ShoppingRatesSnapshot,
} from '@/types/currency.types';
import {
  formatQuantity,
  formatShoppingMoney,
  getItemSubtotal,
} from '@/utils/shoppingUtils';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  displayCurrency: CurrencyCode;
  ratesSnapshot: ShoppingRatesSnapshot;
  editable?: boolean;
  isEditing?: boolean;
  isLast?: boolean;
  onAdjustQuantity?: (delta: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ShoppingItemRow({
  item,
  displayCurrency,
  ratesSnapshot,
  editable = false,
  isEditing = false,
  isLast = false,
  onAdjustQuantity,
  onEdit,
  onDelete,
}: ShoppingItemRowProps) {
  const COLORS = useThemeColors();

  const nativeSubtotal = item.unitPrice * item.quantity;
  const convertedSubtotal = getItemSubtotal(
    item,
    displayCurrency,
    ratesSnapshot,
  );

  return (
    <View
      className={`py-3 ${!isLast ? 'border-b border-border/50' : ''}`}
      style={
        isEditing
          ? {
              backgroundColor: `${COLORS.primary}10`,
              marginHorizontal: -12,
              paddingHorizontal: 12,
              borderRadius: 12,
            }
          : undefined
      }
    >
      <View className="flex-row items-center justify-between gap-2">
        {/* Product info */}
        <Pressable
          onPress={editable ? onEdit : undefined}
          disabled={!editable || !onEdit}
          className="flex-1 gap-0.5 active:opacity-75"
        >
          <View className="flex-row items-center gap-1.5">
            <CurrencyIcon currency={item.currency} size={14} />
            <Text
              className="flex-1 text-sm font-semibold text-text-primary"
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <Text
            className="text-xs text-text-muted"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatQuantity(item.quantity)} ×{' '}
            {formatShoppingMoney(item.unitPrice, item.currency)}
          </Text>
        </Pressable>

        {/* Subtotal in selected display currency */}
        <View className="items-end gap-0.5">
          <Text
            className="text-sm font-semibold text-text-primary"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatShoppingMoney(convertedSubtotal, displayCurrency)}
          </Text>
          {item.currency !== displayCurrency && (
            <Text
              className="text-[11px] text-text-muted"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatShoppingMoney(nativeSubtotal, item.currency)}
            </Text>
          )}
        </View>
      </View>

      {/* Edit & Quantity controls when in calculator mode */}
      {editable && (
        <View className="mt-2.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onAdjustQuantity?.(-1);
              }}
              hitSlop={4}
              className="h-7 w-7 items-center justify-center rounded-lg bg-surface-elevated active:opacity-75"
            >
              <Minus size={13} color={COLORS.textPrimary} />
            </Pressable>
            <Text
              className="min-w-[26px] text-center text-xs font-bold text-text-primary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatQuantity(item.quantity)}
            </Text>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onAdjustQuantity?.(1);
              }}
              hitSlop={4}
              className="h-7 w-7 items-center justify-center rounded-lg bg-surface-elevated active:opacity-75"
            >
              <Plus size={13} color={COLORS.primary} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2">
            {onEdit && (
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  onEdit();
                }}
                hitSlop={6}
                className="flex-row items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-1.5 active:opacity-75"
              >
                <Pencil size={12} color={COLORS.textSecondary} />
                <Text className="text-[11px] font-medium text-text-secondary">
                  Editar
                </Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDelete();
                }}
                hitSlop={6}
                className="rounded-lg bg-danger/10 p-1.5 active:opacity-75"
              >
                <Trash2 size={14} color={COLORS.danger} />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
