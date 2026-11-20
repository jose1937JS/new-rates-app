import type { ShoppingList } from '@/types/currency.types';
import { formatFullDateTime, formatNumber } from '@/utils/formatters';
import {
  compareActualPaid,
  formatQuantity,
  formatShoppingMoney,
  getItemSubtotal,
  getListTotals,
} from '@/utils/shoppingUtils';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildShoppingTicketText(
  list: ShoppingList,
  businessName?: string,
): string {
  const totals = getListTotals(list);
  const secondary = list.displayCurrency === 'VES' ? 'USD' : 'VES';
  const actual = compareActualPaid(
    totals,
    list.actualPaidAmount,
    list.actualPaidCurrency,
    list.displayCurrency,
    list.ratesSnapshot,
  );

  const lines: string[] = [];
  if (businessName?.trim()) {
    lines.push(`🧾 *${businessName.trim()}*`);
  }
  lines.push(`🛒 *${list.title}*`);
  lines.push(`📅 ${formatFullDateTime(list.completedAt ?? list.createdAt)}`);
  lines.push('');

  for (const item of list.items) {
    const sub = getItemSubtotal(item, list.displayCurrency, list.ratesSnapshot);
    lines.push(
      `• ${formatQuantity(item.quantity)}× ${item.name} (${formatShoppingMoney(item.unitPrice, item.currency)}) = *${formatShoppingMoney(sub, list.displayCurrency)}*`,
    );
  }

  lines.push('');
  lines.push(
    `*TOTAL: ${formatShoppingMoney(totals[list.displayCurrency], list.displayCurrency)}* (${formatShoppingMoney(totals[secondary], secondary)})`,
  );
  if (actual.hasActualPaid) {
    lines.push(
      `Pagado real: ${formatShoppingMoney(actual.actualInDisplay, list.displayCurrency)}`,
    );
  }
  lines.push('');
  lines.push(
    `_Tasas: USD ${formatNumber(list.ratesSnapshot.usdToVes)} Bs • USDT ${formatNumber(list.ratesSnapshot.usdtToVes)} Bs — RatesVenApp_`,
  );
  return lines.join('\n');
}

export function buildShoppingTicketHtml(
  list: ShoppingList,
  businessName?: string,
): string {
  const totals = getListTotals(list);
  const secondary = list.displayCurrency === 'VES' ? 'USD' : 'VES';
  const actual = compareActualPaid(
    totals,
    list.actualPaidAmount,
    list.actualPaidCurrency,
    list.displayCurrency,
    list.ratesSnapshot,
  );
  const headerName = businessName?.trim() || 'RATESVEN';

  const itemsHtml = list.items
    .map((item) => {
      const sub = getItemSubtotal(item, list.displayCurrency, list.ratesSnapshot);
      return `
        <tr>
          <td style="padding:6px 0;">
            <div style="font-weight:600;color:#0f172a;">${escapeHtml(item.name)}</div>
            <div style="font-size:11px;color:#64748b;">${formatQuantity(item.quantity)} &times; ${escapeHtml(formatShoppingMoney(item.unitPrice, item.currency))}</div>
          </td>
          <td style="padding:6px 0;text-align:right;font-weight:700;white-space:nowrap;color:#0f172a;">
            ${escapeHtml(formatShoppingMoney(sub, list.displayCurrency))}
          </td>
        </tr>
      `;
    })
    .join('');

  const actualHtml = actual.hasActualPaid
    ? `<div class="actual"><span>Real cobrado:</span><strong>${escapeHtml(formatShoppingMoney(actual.actualInDisplay, list.displayCurrency))}</strong></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 18px; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; background: #fff; }
  .ticket { max-width: 420px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; }
  .header { text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px; }
  .biz { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 800; color: #ff6b26; }
  .title { font-size: 18px; font-weight: 700; margin: 4px 0 2px; }
  .date { font-size: 11px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; border-bottom: 1px dashed #cbd5e1; }
  .total-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px; }
  .total-label { font-size: 12px; font-weight: 700; color: #475569; }
  .total-val { font-size: 20px; font-weight: 800; color: #ff6b26; }
  .sub-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 4px; }
  .actual { display: flex; justify-content: space-between; background: #f1f5f9; border-radius: 8px; padding: 8px 10px; margin-top: 10px; font-size: 12px; }
  .footer { text-align: center; border-top: 1px dashed #cbd5e1; margin-top: 14px; padding-top: 10px; font-size: 10px; color: #64748b; }
</style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="biz">${escapeHtml(headerName)}</div>
      <div class="title">${escapeHtml(list.title)}</div>
      <div class="date">${escapeHtml(formatFullDateTime(list.completedAt ?? list.createdAt))}</div>
    </div>
    <table>${itemsHtml}</table>
    <div class="total-row">
      <span class="total-label">TOTAL (${escapeHtml(list.displayCurrency)})</span>
      <span class="total-val">${escapeHtml(formatShoppingMoney(totals[list.displayCurrency], list.displayCurrency))}</span>
    </div>
    <div class="sub-row">
      <span>Equivalente (${escapeHtml(secondary)})</span>
      <span>${escapeHtml(formatShoppingMoney(totals[secondary], secondary))}</span>
    </div>
    ${actualHtml}
    <div class="footer">
      Tasas: USD ${formatNumber(list.ratesSnapshot.usdToVes)} Bs &bull; EUR ${formatNumber(list.ratesSnapshot.eurToVes)} Bs &bull; USDT ${formatNumber(list.ratesSnapshot.usdtToVes)} Bs<br/>
      Generado con RatesVenApp
    </div>
  </div>
</body>
</html>`;
}
