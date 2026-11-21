import { formatBankLabel } from '@/constants/banks';
import type {
  CurrencyCode,
  EffectiveRatesSnapshot,
  PaymentMethodType,
  PaymentTemplate,
  RateSourceId,
} from '@/types/currency.types';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import {
  convertWithRateSource,
  getRateForSource,
} from '@/utils/customRateUtils';
import { formatBankAmount, formatNumber } from '@/utils/formatters';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  pago_movil: 'Pago Móvil',
  transferencia: 'Transferencia',
  binance: 'Binance Pay',
  zelle: 'Zelle',
  otro: 'Otro método',
};

export function sanitizeDigits(text: string): string {
  return text.replace(/\D/g, '');
}

export function formatPhoneDisplay(raw: string): string {
  const digits = sanitizeDigits(raw).slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VE_PHONE_REGEX = /^04(12|14|16|24|26)\d{7}$/;

export function validatePaymentTemplate(
  template: Partial<PaymentTemplate> & { type: PaymentMethodType },
): string | null {
  if (!template.alias?.trim()) {
    return 'Escribe un alias para identificar esta plantilla.';
  }

  switch (template.type) {
    case 'pago_movil': {
      const t = template as Partial<Extract<PaymentTemplate, { type: 'pago_movil' }>>;
      if (!t.bankCode || t.bankCode.length !== 4) {
        return 'Selecciona un banco válido.';
      }
      const phone = sanitizeDigits(t.phone ?? '');
      if (!VE_PHONE_REGEX.test(phone)) {
        return 'Ingresa un teléfono válido de 11 dígitos (0412, 0414, 0416, 0424 o 0426).';
      }
      const doc = sanitizeDigits(t.idNumber ?? '');
      if (doc.length < 6 || doc.length > 10) {
        return 'Ingresa una cédula o RIF válido (6 a 10 dígitos).';
      }
      return null;
    }
    case 'transferencia': {
      const t = template as Partial<
        Extract<PaymentTemplate, { type: 'transferencia' }>
      >;
      if (!t.bankCode || t.bankCode.length !== 4) {
        return 'Selecciona un banco válido.';
      }
      const account = sanitizeDigits(t.accountNumber ?? '');
      if (account.length !== 20) {
        return 'El número de cuenta debe tener 20 dígitos.';
      }
      if (!account.startsWith(t.bankCode)) {
        return `La cuenta debe comenzar con ${t.bankCode} para ese banco.`;
      }
      const doc = sanitizeDigits(t.idNumber ?? '');
      if (doc.length < 6 || doc.length > 10) {
        return 'Ingresa una cédula o RIF válido (6 a 10 dígitos).';
      }
      return null;
    }
    case 'binance': {
      const t = template as Partial<Extract<PaymentTemplate, { type: 'binance' }>>;
      const payId = sanitizeDigits(t.payId ?? '');
      const email = t.email?.trim() ?? '';
      const username = t.username?.replace(/^@/, '').trim() ?? '';

      if (!t.payId?.trim() && !email && !username) {
        return 'Ingresa al menos tu Binance Pay ID, correo o usuario.';
      }
      if (t.payId?.trim() && (payId.length < 6 || payId.length > 12)) {
        return 'El Binance Pay ID debe ser numérico (6 a 12 dígitos).';
      }
      if (email && !EMAIL_REGEX.test(email)) {
        return 'Ingresa un correo electrónico válido para Binance Pay.';
      }
      if (username && username.length < 3) {
        return 'El usuario de Binance debe tener al menos 3 caracteres.';
      }
      return null;
    }
    case 'zelle': {
      const t = template as Partial<Extract<PaymentTemplate, { type: 'zelle' }>>;
      const contact = t.email?.trim() ?? '';
      const phoneDigits = sanitizeDigits(contact);
      const isEmail = EMAIL_REGEX.test(contact);
      const isPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
      if (!isEmail && !isPhone) {
        return 'Ingresa un correo electrónico o teléfono válido para Zelle.';
      }
      return null;
    }
    case 'otro': {
      const t = template as Partial<Extract<PaymentTemplate, { type: 'otro' }>>;
      const text = t.freeText?.trim() ?? '';
      if (text.length < 3) {
        return 'Escribe los datos de pago a guardar (mínimo 3 caracteres).';
      }
      return null;
    }
  }
}

export function getTemplateSummary(template: PaymentTemplate): string {
  switch (template.type) {
    case 'pago_movil':
      return `${formatBankLabel(template.bankCode)} • ${formatPhoneDisplay(template.phone)}`;
    case 'transferencia':
      return `${formatBankLabel(template.bankCode)} • ****${template.accountNumber.slice(-4)}`;
    case 'binance':
      return (
        template.payId ||
        template.email ||
        (template.username ? `@${template.username}` : 'Binance Pay')
      );
    case 'zelle':
      return template.email;
    case 'otro':
      return template.freeText.split('\n')[0] ?? 'Datos personalizados';
  }
}

export function buildPaymentShareMessage({
  template,
  amount = 0,
  currency = 'VES',
  rateSource = 'BCV_USD',
  snapshot,
  includeEquivalents = true,
  bankSafeAmountOnly = false,
}: {
  template: PaymentTemplate;
  amount?: number;
  currency?: CurrencyCode;
  rateSource?: RateSourceId;
  snapshot?: EffectiveRatesSnapshot;
  includeEquivalents?: boolean;
  bankSafeAmountOnly?: boolean;
}): string {
  const lines: string[] = [];

  if (template.holderName?.trim()) {
    lines.push(`👤 Titular: ${template.holderName.trim()}`);
  }

  switch (template.type) {
    case 'pago_movil':
      lines.unshift('💳 Pago Móvil');
      lines.push(`🏦 Banco: ${formatBankLabel(template.bankCode)}`);
      lines.push(`📱 Teléfono: ${formatPhoneDisplay(template.phone)}`);
      lines.push(`🪪 Cédula/RIF: ${template.idPrefix}-${template.idNumber}`);
      break;
    case 'transferencia':
      lines.unshift('🏦 Transferencia Bancaria');
      lines.push(`🏦 Banco: ${formatBankLabel(template.bankCode)}`);
      lines.push(`🔢 Cuenta: ${template.accountNumber}`);
      lines.push(`🪪 Cédula/RIF: ${template.idPrefix}-${template.idNumber}`);
      break;
    case 'binance':
      lines.unshift('🟡 Binance Pay');
      if (template.payId?.trim()) lines.push(`🆔 Pay ID: ${template.payId.trim()}`);
      if (template.email?.trim()) lines.push(`✉️ Correo: ${template.email.trim()}`);
      if (template.username?.trim()) {
        lines.push(`👤 Usuario: @${template.username.replace(/^@/, '').trim()}`);
      }
      break;
    case 'zelle':
      lines.unshift('🟣 Zelle');
      lines.push(`✉️ Correo/Tlf: ${template.email.trim()}`);
      break;
    case 'otro':
      lines.unshift(`💠 ${template.alias}`);
      lines.push(template.freeText.trim());
      break;
  }

  if (amount > 0) {
    lines.push('');
    if (snapshot) {
      const conversions = convertWithRateSource(
        amount,
        currency,
        rateSource,
        snapshot,
      );
      const sourceInfo = getRateForSource(rateSource, snapshot);
      const vesText = bankSafeAmountOnly
        ? formatBankAmount(conversions.VES)
        : formatNumber(conversions.VES);

      if (currency === 'VES') {
        lines.push(`💵 Monto: ${vesText} Bs`);
        if (includeEquivalents && sourceInfo.rateToVes > 0) {
          const equivValue = amount / sourceInfo.rateToVes;
          const equivSymbol =
            rateSource === 'BCV_EUR'
              ? '€'
              : rateSource === 'USDT'
                ? '₮'
                : '$';
          lines.push(
            `   (${formatNumber(equivValue)} ${equivSymbol} • tasa ${sourceInfo.label}: ${formatNumber(sourceInfo.rateToVes, 2)} Bs)`,
          );
        }
      } else {
        lines.push(
          `💵 Monto: ${CURRENCY_SYMBOLS[currency]} ${formatNumber(amount)} ${currency}`,
        );
        if (includeEquivalents && conversions.VES > 0) {
          lines.push(
            `   Equivale a: ${vesText} Bs (tasa ${sourceInfo.label}: ${formatNumber(sourceInfo.rateToVes, 2)} Bs)`,
          );
        }
      }
    } else {
      lines.push(
        `💵 Monto: ${CURRENCY_SYMBOLS[currency]} ${formatNumber(amount)} ${currency}`,
      );
    }
  }

  return lines.join('\n');
}
