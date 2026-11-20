import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Format number as Venezuelan bolívares: "1.234,56 Bs" */
export function formatVES(value: number): string {
  return `${formatNumber(value, 2)} Bs`;
}

/** Format number as US dollars: "$1,234.56" */
export function formatUSD(value: number): string {
  return `$${formatNumber(value, 2)}`;
}

/** Format exchange rate with 2 decimal places */
export function formatRate(value: number): string {
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format number with specified decimals */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** "Hace 3 min" / "Hace 2 horas" */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

/** "07 Sep" — for chart X axis */
export function formatChartDate(date: string): string {
  try {
    return format(parseISO(date), 'dd MMM', { locale: es });
  } catch {
    return date;
  }
}

/** "14:30" — for intraday chart X axis and history items */
export function formatChartTime(date: string): string {
  try {
    return format(parseISO(date), 'HH:mm', { locale: es });
  } catch {
    return '';
  }
}

/** "07/09/2026" — for display */
export function formatFullDate(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy');
  } catch {
    return date;
  }
}

/** "07/09/2026 14:30" — for intraday chart pointer display */
export function formatFullDateTime(date: string): string {
  try {
    return format(parseISO(date), 'dd MMM yyyy HH:mm', { locale: es });
  } catch {
    return date;
  }
}

/** "07 Sep 2026" — for history list display */
export function formatHistoryDate(date: string): string {
  try {
    return format(parseISO(date), 'dd MMM yyyy', { locale: es });
  } catch {
    return date;
  }
}

/** "Lunes" — capitalized day name */
export function formatDayOfWeek(date: string): string {
  try {
    const day = format(parseISO(date), 'EEEE', { locale: es });
    return day.charAt(0).toUpperCase() + day.slice(1);
  } catch {
    return '';
  }
}

/** Format percentage change: "+2.3%" or "-1.5%" */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Parse an input or formatted number string back to a number */
export function parseFormattedNumber(text: string): number {
  const cleaned = text.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  let normalized = cleaned;
  if (lastDot !== -1 && lastComma !== -1) {
    normalized =
      lastDot > lastComma
        ? cleaned.replace(/,/g, '')
        : cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastComma !== -1) {
    const commaCount = (cleaned.match(/,/g) ?? []).length;
    normalized =
      commaCount === 1 ? cleaned.replace(',', '.') : cleaned.replace(/,/g, '');
  } else if (lastDot !== -1) {
    const dotCount = (cleaned.match(/\./g) ?? []).length;
    normalized = dotCount === 1 ? cleaned : cleaned.replace(/\./g, '');
  }

  const result = parseFloat(normalized);
  return Number.isFinite(result) ? result : 0;
}

/** Format input for display while typing (thousands separator) */
export function formatInputValue(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0] ?? '';
  const decPart = parts.length > 1 ? `.${parts[1]?.slice(0, 2) ?? ''}` : '';

  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted}${decPart}`;
}
