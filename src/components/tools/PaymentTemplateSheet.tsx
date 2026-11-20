import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppSheet } from '@/components/ui/AppSheet';
import { ClearInputButton } from '@/components/ui/ClearInputButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { VENEZUELAN_BANKS, formatBankLabel } from '@/constants/banks';
import { useTabTransition } from '@/hooks/useTabTransition';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CreatePaymentTemplateInput } from '@/store/paymentTemplatesStore';
import type {
  IdDocPrefix,
  PaymentMethodType,
  PaymentTemplate,
} from '@/types/currency.types';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import {
  PAYMENT_METHOD_LABELS,
  sanitizeDigits,
  validatePaymentTemplate,
} from '@/utils/paymentFormat';

interface PaymentTemplateSheetProps {
  visible: boolean;
  editingTemplate?: PaymentTemplate | null;
  onSave: (input: CreatePaymentTemplateInput) => void;
  onClose: () => void;
}

const METHOD_TYPES: PaymentMethodType[] = [
  'pago_movil',
  'transferencia',
  'binance',
  'zelle',
  'otro',
];

const ID_PREFIXES: IdDocPrefix[] = ['V', 'E', 'J', 'G', 'P'];

export function PaymentTemplateSheet({
  visible,
  editingTemplate,
  onSave,
  onClose,
}: PaymentTemplateSheetProps) {
  const COLORS = useThemeColors();
  const { triggerTransition, transitionStyle } = useTabTransition();

  const [type, setType] = useState<PaymentMethodType>('pago_movil');
  const [alias, setAlias] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bankCode, setBankCode] = useState('0102');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idPrefix, setIdPrefix] = useState<IdDocPrefix>('V');
  const [idNumber, setIdNumber] = useState('');
  const [payId, setPayId] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [freeText, setFreeText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMsg(null);
    setShowBankPicker(false);

    if (!editingTemplate) {
      setType('pago_movil');
      setAlias('');
      setHolderName('');
      setBankCode('0102');
      setPhone('');
      setAccountNumber('');
      setIdPrefix('V');
      setIdNumber('');
      setPayId('');
      setEmail('');
      setUsername('');
      setFreeText('');
      return;
    }

    setType(editingTemplate.type);
    setAlias(editingTemplate.alias);
    setHolderName(editingTemplate.holderName ?? '');
    if (editingTemplate.type === 'pago_movil') {
      setBankCode(editingTemplate.bankCode);
      setPhone(editingTemplate.phone);
      setIdPrefix(editingTemplate.idPrefix);
      setIdNumber(editingTemplate.idNumber);
    } else if (editingTemplate.type === 'transferencia') {
      setBankCode(editingTemplate.bankCode);
      setAccountNumber(editingTemplate.accountNumber);
      setIdPrefix(editingTemplate.idPrefix);
      setIdNumber(editingTemplate.idNumber);
    } else if (editingTemplate.type === 'binance') {
      setPayId(editingTemplate.payId ?? '');
      setEmail(editingTemplate.email ?? '');
      setUsername(editingTemplate.username ?? '');
    } else if (editingTemplate.type === 'zelle') {
      setEmail(editingTemplate.email);
    } else if (editingTemplate.type === 'otro') {
      setFreeText(editingTemplate.freeText);
    }
  }, [visible, editingTemplate]);

  const clearError = () => {
    if (errorMsg) setErrorMsg(null);
  };

  const buildPayload = (): CreatePaymentTemplateInput => {
    const common = {
      alias: alias.trim(),
      holderName: holderName.trim() || undefined,
    };

    switch (type) {
      case 'pago_movil':
        return {
          ...common,
          type: 'pago_movil',
          bankCode,
          phone: sanitizeDigits(phone),
          idPrefix,
          idNumber: sanitizeDigits(idNumber),
        };
      case 'transferencia':
        return {
          ...common,
          type: 'transferencia',
          bankCode,
          accountNumber: sanitizeDigits(accountNumber),
          idPrefix,
          idNumber: sanitizeDigits(idNumber),
        };
      case 'binance':
        return {
          ...common,
          type: 'binance',
          payId: sanitizeDigits(payId) || undefined,
          email: email.trim() || undefined,
          username: username.replace(/^@/, '').trim() || undefined,
        };
      case 'zelle':
        return {
          ...common,
          type: 'zelle',
          email: email.trim(),
        };
      case 'otro':
        return {
          ...common,
          type: 'otro',
          freeText: freeText.trim(),
        };
    }
  };

  const handleSave = () => {
    const payload = buildPayload();
    const err = validatePaymentTemplate(payload);
    if (err) {
      setErrorMsg(err);
      return;
    }
    triggerImpactHaptic('light');
    onSave(payload);
    onClose();
  };

  const handleSelectMethod = (next: PaymentMethodType) => {
    const prevIdx = METHOD_TYPES.indexOf(type);
    const nextIdx = METHOD_TYPES.indexOf(next);
    setErrorMsg(null);
    setShowBankPicker(false);
    setType(next);
    triggerTransition(nextIdx, prevIdx);
  };

  return (
    <AppSheet
      visible={visible}
      title={editingTemplate ? 'Editar plantilla' : 'Nueva plantilla de pago'}
      subtitle="Guarda datos frecuentes para copiar y enviar rápido"
      onClose={onClose}
      footer={
        <Pressable
          onPress={handleSave}
          className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
          style={{
            backgroundColor: COLORS.primary,
            borderCurve: 'continuous',
          }}
        >
          <Check size={17} color="#ffffff" strokeWidth={2.5} />
          <Text className="text-sm font-medium text-white">
            {editingTemplate ? 'Guardar cambios' : 'Guardar plantilla'}
          </Text>
        </Pressable>
      }
    >
      <View className="gap-3.5">
        {/* Method Type Selector */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-text-secondary">
            Tipo de método
          </Text>
          <SegmentedControl
            scrollable
            options={METHOD_TYPES.map((m) => ({
              id: m,
              label: PAYMENT_METHOD_LABELS[m],
            }))}
            selected={type}
            onSelect={handleSelectMethod}
          />
        </View>

        {/* Alias & Holder */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-text-secondary">
            Alias o nombre de la plantilla *
          </Text>
          <TextInput
            value={alias}
            onChangeText={(txt) => {
              clearError();
              setAlias(txt);
            }}
            placeholder="Ej. Mi Banesco personal, Proveedor Juan"
            placeholderTextColor={COLORS.textMuted}
            maxLength={36}
            className="rounded-xl border border-border bg-surface-elevated px-3.5"
            style={singleLineInputStyle({ color: COLORS.textPrimary })}
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-text-secondary">
            Nombre del titular (opcional)
          </Text>
          <TextInput
            value={holderName}
            onChangeText={setHolderName}
            placeholder="Ej. María Pérez"
            placeholderTextColor={COLORS.textMuted}
            maxLength={40}
            className="rounded-xl border border-border bg-surface-elevated px-3.5"
            style={singleLineInputStyle({ color: COLORS.textPrimary })}
          />
        </View>

        {/* Animated method-specific fields */}
        <Animated.View style={transitionStyle} className="gap-3.5">
          {(type === 'pago_movil' || type === 'transferencia') && (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-text-secondary">
                Banco *
              </Text>
              <Pressable
                onPress={() => {
                  triggerSelectionHaptic();
                  setShowBankPicker((prev) => !prev);
                }}
                className="h-11 flex-row items-center justify-between rounded-xl border border-border bg-surface-elevated px-3.5 active:opacity-80"
              >
                <Text className="text-sm font-medium text-text-primary">
                  {formatBankLabel(bankCode)}
                </Text>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </Pressable>

              {showBankPicker && (
                <Animated.View entering={FadeIn.duration(150)}>
                  <ScrollView
                    nestedScrollEnabled
                    className="max-h-44 rounded-xl border border-border bg-surface-elevated"
                  >
                    {VENEZUELAN_BANKS.map((bank) => {
                      const selected = bank.code === bankCode;
                      return (
                        <Pressable
                          key={bank.code}
                          onPress={() => {
                            triggerSelectionHaptic();
                            clearError();
                            setBankCode(bank.code);
                            if (
                              type === 'transferencia' &&
                              !accountNumber.startsWith(bank.code)
                            ) {
                              setAccountNumber(
                                `${bank.code}${accountNumber.slice(4)}`,
                              );
                            }
                            setShowBankPicker(false);
                          }}
                          className="flex-row items-center justify-between border-b border-border/50 px-3.5 py-2.5"
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{
                              color: selected ? COLORS.primary : COLORS.textPrimary,
                            }}
                          >
                            {bank.code} - {bank.name}
                          </Text>
                          {selected && <Check size={14} color={COLORS.primary} />}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
              )}
            </View>
          )}

          {type === 'pago_movil' && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Teléfono (11 dígitos) *
              </Text>
              <View className="h-11 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
                <TextInput
                  value={phone}
                  onChangeText={(txt) => {
                    clearError();
                    setPhone(sanitizeDigits(txt).slice(0, 11));
                  }}
                  keyboardType="phone-pad"
                  placeholder="04141234567"
                  placeholderTextColor={COLORS.textMuted}
                  className="flex-1"
                  style={singleLineInputStyle({
                    color: COLORS.textPrimary,
                    weight: 'semibold',
                    tabularNums: true,
                  })}
                />
                <ClearInputButton
                  visible={phone.length > 0}
                  onPress={() => {
                    clearError();
                    setPhone('');
                  }}
                />
              </View>
            </View>
          )}

          {type === 'transferencia' && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Número de cuenta (20 dígitos) *
              </Text>
              <View className="h-11 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
                <TextInput
                  value={accountNumber}
                  onChangeText={(txt) => {
                    clearError();
                    setAccountNumber(sanitizeDigits(txt).slice(0, 20));
                  }}
                  keyboardType="number-pad"
                  placeholder={`${bankCode}0000000000000000`}
                  placeholderTextColor={COLORS.textMuted}
                  className="flex-1"
                  style={singleLineInputStyle({
                    color: COLORS.textPrimary,
                    weight: 'semibold',
                    tabularNums: true,
                  })}
                />
                <ClearInputButton
                  visible={accountNumber.length > 0}
                  onPress={() => {
                    clearError();
                    setAccountNumber('');
                  }}
                />
              </View>
            </View>
          )}

          {(type === 'pago_movil' || type === 'transferencia') && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Cédula o RIF *
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="w-[164px]">
                  <SegmentedControl
                    compact
                    options={ID_PREFIXES.map((pref) => ({ id: pref, label: pref }))}
                    selected={idPrefix}
                    onSelect={setIdPrefix}
                  />
                </View>
                <View className="h-11 flex-1 flex-row items-center gap-1 rounded-xl border border-border bg-surface-elevated px-3">
                  <TextInput
                    value={idNumber}
                    onChangeText={(txt) => {
                      clearError();
                      setIdNumber(sanitizeDigits(txt).slice(0, 10));
                    }}
                    keyboardType="number-pad"
                    placeholder="12345678"
                    placeholderTextColor={COLORS.textMuted}
                    className="flex-1"
                    style={singleLineInputStyle({
                      color: COLORS.textPrimary,
                      weight: 'semibold',
                      tabularNums: true,
                    })}
                  />
                  <ClearInputButton
                    visible={idNumber.length > 0}
                    onPress={() => {
                      clearError();
                      setIdNumber('');
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          {type === 'binance' && (
            <View className="gap-3">
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-text-secondary">
                  Binance Pay ID
                </Text>
                <View className="h-11 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
                  <TextInput
                    value={payId}
                    onChangeText={(txt) => {
                      clearError();
                      setPayId(sanitizeDigits(txt).slice(0, 12));
                    }}
                    keyboardType="number-pad"
                    placeholder="Ej. 245678901"
                    placeholderTextColor={COLORS.textMuted}
                    className="flex-1"
                    style={singleLineInputStyle({
                      color: COLORS.textPrimary,
                      tabularNums: true,
                    })}
                  />
                  <ClearInputButton
                    visible={payId.length > 0}
                    onPress={() => {
                      clearError();
                      setPayId('');
                    }}
                  />
                </View>
              </View>
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-text-secondary">
                  Correo registrado
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(txt) => {
                    clearError();
                    setEmail(txt);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="usuario@correo.com"
                  placeholderTextColor={COLORS.textMuted}
                  className="rounded-xl border border-border bg-surface-elevated px-3.5"
                  style={singleLineInputStyle({ color: COLORS.textPrimary })}
                />
              </View>
              <View className="gap-1.5">
                <Text className="text-xs font-semibold text-text-secondary">
                  Alias / Usuario (opcional)
                </Text>
                <TextInput
                  value={username}
                  onChangeText={(txt) => {
                    clearError();
                    setUsername(txt);
                  }}
                  autoCapitalize="none"
                  placeholder="@alias"
                  placeholderTextColor={COLORS.textMuted}
                  className="rounded-xl border border-border bg-surface-elevated px-3.5"
                  style={singleLineInputStyle({ color: COLORS.textPrimary })}
                />
              </View>
            </View>
          )}

          {type === 'zelle' && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Correo o teléfono Zelle *
              </Text>
              <TextInput
                value={email}
                onChangeText={(txt) => {
                  clearError();
                  setEmail(txt);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="zelle@correo.com"
                placeholderTextColor={COLORS.textMuted}
                className="rounded-xl border border-border bg-surface-elevated px-3.5"
                style={singleLineInputStyle({ color: COLORS.textPrimary })}
              />
            </View>
          )}

          {type === 'otro' && (
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Datos de pago *
              </Text>
              <TextInput
                value={freeText}
                onChangeText={(txt) => {
                  clearError();
                  setFreeText(txt);
                }}
                multiline
                numberOfLines={4}
                placeholder="Escribe los datos bancarios, billetera o instrucciones"
                placeholderTextColor={COLORS.textMuted}
                className="rounded-xl border border-border bg-surface-elevated px-3.5"
                style={{
                  minHeight: 96,
                  paddingVertical: 10,
                  fontSize: 14,
                  fontFamily: 'Poppins_400Regular',
                  color: COLORS.textPrimary,
                  textAlignVertical: 'top',
                  includeFontPadding: false,
                }}
              />
            </View>
          )}
        </Animated.View>

        {errorMsg ? (
          <Text className="text-xs font-medium text-danger">{errorMsg}</Text>
        ) : null}
      </View>
    </AppSheet>
  );
}
