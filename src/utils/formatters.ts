import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Format number as Venezuelan bolívares: "1.234,56 Bs" */
export function formatVES(value: number): string {
  return `${formatNumber(value, 2)} Bs`;
}

/** Format number as US dollars: "$1,234.56" */
export function formatUSD(value: number): string {
  return `$${formatNumber(value, 2)}`;
}

/** Format exchange rate with 4 decimal places */
export function formatRate(value: number): string {
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
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
  return format(parseISO(date), 'dd MMM', { locale: es });
}

/** "07/09/2026" — for display */
export function formatFullDate(date: string): string {
  return format(parseISO(date), 'dd/MM/yyyy');
}

/** Format percentage change: "+2.3%" or "-1.5%" */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Parse a formatted number string back to a number */
export function parseFormattedNumber(text: string): number {
  // Remove everything except digits, dots, and commas
  const cleaned = text.replace(/[^\d.,]/g, '');
  // Handle Venezuelan format (dot as thousands, comma as decimal)
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
}

/** Format input for display while typing (thousands separator) */
export function formatInputValue(text: string): string {
  // Allow only digits and one decimal separator
  const cleaned = text.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0] ?? '';
  const decPart = parts.length > 1 ? `.${parts[1]?.slice(0, 2) ?? ''}` : '';

  // Add thousands separators
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted}${decPart}`;
}
