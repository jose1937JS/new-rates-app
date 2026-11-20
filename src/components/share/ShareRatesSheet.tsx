import { useRouter } from 'expo-router';
import { Copy, CreditCard, Image as ImageIcon, Share2, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  RateShareCard,
  type ShareCardTheme,
} from '@/components/share/RateShareCard';
import { CurrencyChipRow } from '@/components/shopping/CurrencyChipRow';
import { AppSheet } from '@/components/ui/AppSheet';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SelectableChip } from '@/components/ui/SelectableChip';
import { useEffectiveRates } from '@/hooks/useEffectiveRates';
import { useTabTransition } from '@/hooks/useTabTransition';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CurrencyCode } from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { formatNumber, parseFormattedNumber } from '@/utils/formatters';
import { triggerImpactHaptic, triggerSelectionHaptic } from '@/utils/haptics';
import { singleLineInputStyle } from '@/utils/inputStyles';
import { copyToClipboard, shareViewAsImage } from '@/utils/shareUtils';
import { sanitizeDecimalInput } from '@/utils/shoppingUtils';

type OfficialShareCode = 'USD' | 'EUR' | 'USDT';

interface ShareRatesStudioProps {
  initialAmount?: number;
  initialCurrency?: CurrencyCode;
  onAfterNavigate?: () => void;
}

const THEME_CHOICES: Array<{ id: ShareCardTheme; label: string }> = [
  { id: 'brand', label: 'Marca' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
];

export function ShareRatesStudio({
  initialAmount = 0,
  initialCurrency = 'USD',
  onAfterNavigate,
}: ShareRatesStudioProps) {
  const router = useRouter();
  const COLORS = useThemeColors();
  const { rates, enabledCustomRates } = useEffectiveRates();
  const { triggerTransition, transitionStyle } = useTabTransition();
  const cardRef = useRef<View>(null);

  const [cardTheme, setCardTheme] = useState<ShareCardTheme>('brand');
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialShareCode[]>([
    'USD',
    'EUR',
    'USDT',
  ]);
  const [selectedCustomIds, setSelectedCustomIds] = useState<string[]>(() =>
    enabledCustomRates.map((e) => e.item.id),
  );
  const [amountText, setAmountText] = useState(
    initialAmount > 0 ? String(initialAmount) : '',
  );
  const [amountCurrency, setAmountCurrency] =
    useState<CurrencyCode>(initialCurrency);
  const [sharing, setSharing] = useState(false);

  if (!rates) {
    return (
      <Text className="py-6 text-center text-sm text-text-muted">
        Carga las tasas primero para generar la tarjeta para compartir.
      </Text>
    );
  }

  const parsedAmount = amountText ? parseFormattedNumber(amountText) : 0;

  const toggleOfficial = (code: OfficialShareCode) => {
    triggerSelectionHaptic();
    setSelectedOfficial((prev) =>
      prev.includes(code)
        ? prev.length > 1 || selectedCustomIds.length > 0
          ? prev.filter((c) => c !== code)
          : prev
        : [...prev, code],
    );
  };

  const toggleCustom = (id: string) => {
    triggerSelectionHaptic();
    setSelectedCustomIds((prev) =>
      prev.includes(id)
        ? prev.length > 1 || selectedOfficial.length > 0
          ? prev.filter((c) => c !== id)
          : prev
        : [...prev, id],
    );
  };

  const visibleCustom = enabledCustomRates.filter((entry) =>
    selectedCustomIds.includes(entry.item.id),
  );

  const buildPlainTextSummary = () => {
    const lines = ['📊 *Tasas del día — RATESVEN*', ''];
    if (selectedOfficial.includes('USD')) {
      lines.push(`🇺🇸 USD BCV: ${formatNumber(rates.usd.rateToVes)} Bs`);
    }
    if (selectedOfficial.includes('EUR')) {
      lines.push(`🇪🇺 EUR BCV: ${formatNumber(rates.eur.rateToVes)} Bs`);
    }
    if (selectedOfficial.includes('USDT')) {
      lines.push(`₮ USDT Yadio: ${formatNumber(rates.usdt.rateToVes)} Bs`);
    }
    for (const entry of visibleCustom) {
      lines.push(
        `${entry.item.emoji} ${entry.item.label}: ${formatNumber(entry.rateToVes)} Bs`,
      );
    }
    if (parsedAmount > 0) {
      const vesValue =
        amountCurrency === 'VES'
          ? parsedAmount
          : parsedAmount *
            (amountCurrency === 'EUR'
              ? rates.eur.rateToVes
              : amountCurrency === 'USDT'
                ? rates.usdt.rateToVes
                : rates.usd.rateToVes);
      lines.push('');
      lines.push(
        `💵 Monto: ${CURRENCY_SYMBOLS[amountCurrency]} ${formatNumber(parsedAmount)} ${amountCurrency} = ${formatNumber(vesValue)} Bs`,
      );
    }
    return lines.join('\n');
  };

  const handleShareImage = async () => {
    if (sharing) return;
    triggerImpactHaptic('light');
    setSharing(true);
    await shareViewAsImage(cardRef, 'Compartir tasas del día');
    setSharing(false);
  };

  return (
    <View className="gap-4">
      {/* Live Shareable Card Preview */}
      <Animated.View style={transitionStyle}>
        <RateShareCard
          ref={cardRef}
          rates={rates}
          theme={cardTheme}
          includedCurrencies={selectedOfficial}
          includedCustomRates={visibleCustom}
          highlightAmount={parsedAmount}
          highlightCurrency={amountCurrency}
        />
      </Animated.View>

      {/* Style selector */}
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-text-secondary">
          Estilo de la imagen
        </Text>
        <SegmentedControl
          options={THEME_CHOICES}
          selected={cardTheme}
          onSelect={(next) => {
            const prevIdx = THEME_CHOICES.findIndex((c) => c.id === cardTheme);
            const nextIdx = THEME_CHOICES.findIndex((c) => c.id === next);
            setCardTheme(next);
            triggerTransition(nextIdx, prevIdx);
          }}
        />
      </View>

      {/* Currency toggles */}
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-text-secondary">
          Tasas incluidas
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(['USD', 'EUR', 'USDT'] as const).map((code) => (
            <SelectableChip
              key={code}
              label={code}
              active={selectedOfficial.includes(code)}
              onPress={() => toggleOfficial(code)}
            />
          ))}
          {enabledCustomRates.map(({ item }) => (
            <SelectableChip
              key={item.id}
              label={`${item.emoji} ${item.label}`}
              active={selectedCustomIds.includes(item.id)}
              onPress={() => toggleCustom(item.id)}
            />
          ))}
        </View>
      </View>

      {/* Optional Amount */}
      <View className="gap-2">
        <Text className="text-xs font-semibold text-text-secondary">
          Incluir monto calculado (opcional)
        </Text>
        <View className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5">
          <Text
            className="text-base font-bold"
            style={{ color: COLORS.primary }}
          >
            {CURRENCY_SYMBOLS[amountCurrency]}
          </Text>
          <TextInput
            value={amountText}
            onChangeText={(txt) =>
              setAmountText(sanitizeDecimalInput(txt, amountText))
            }
            keyboardType="decimal-pad"
            placeholder="Ej. 100.00 (opcional)"
            placeholderTextColor={COLORS.textMuted}
            className="flex-1"
            style={singleLineInputStyle({
              color: COLORS.textPrimary,
              fontSize: 15,
              height: 48,
              weight: 'semibold',
              tabularNums: true,
            })}
          />
          {amountText.length > 0 && (
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                setAmountText('');
              }}
              hitSlop={6}
              className="rounded-full p-1 active:opacity-70"
            >
              <X size={14} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
        <CurrencyChipRow
          selected={amountCurrency}
          onSelect={setAmountCurrency}
        />
      </View>

      {/* Actions */}
      <View className="gap-2 pt-1">
        <Pressable
          onPress={handleShareImage}
          disabled={sharing}
          className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-85"
          style={{
            backgroundColor: COLORS.primary,
            borderCurve: 'continuous',
          }}
        >
          {sharing ? (
            <Share2 size={17} color="#ffffff" />
          ) : (
            <ImageIcon size={17} color="#ffffff" />
          )}
          <Text className="text-sm font-medium text-white">
            {sharing ? 'Generando imagen...' : 'Compartir imagen'}
          </Text>
        </Pressable>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              triggerSelectionHaptic();
              void copyToClipboard(
                buildPlainTextSummary(),
                'Tasas copiadas como texto',
              );
            }}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated py-2.5 active:opacity-80"
          >
            <Copy size={14} color={COLORS.textPrimary} />
            <Text className="text-xs font-medium text-text-primary">
              Copiar texto
            </Text>
          </Pressable>

          {parsedAmount > 0 && (
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                onAfterNavigate?.();
                router.push({
                  pathname: '/tools/payments',
                  params: {
                    amount: parsedAmount.toFixed(2),
                    currency: amountCurrency,
                  },
                });
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated py-2.5 active:opacity-80"
            >
              <CreditCard size={14} color={COLORS.primary} />
              <Text
                className="text-xs font-medium"
                style={{ color: COLORS.primary }}
              >
                Cobrar con plantilla
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

interface ShareRatesSheetProps {
  visible: boolean;
  onClose: () => void;
  initialAmount?: number;
  initialCurrency?: CurrencyCode;
}

export function ShareRatesSheet({
  visible,
  onClose,
  initialAmount,
  initialCurrency,
}: ShareRatesSheetProps) {
  return (
    <AppSheet
      visible={visible}
      title="Compartir tasas del día"
      subtitle="Vista previa lista para enviar por WhatsApp"
      onClose={onClose}
    >
      {visible && (
        <ShareRatesStudio
          initialAmount={initialAmount}
          initialCurrency={initialCurrency}
          onAfterNavigate={onClose}
        />
      )}
    </AppSheet>
  );
}
