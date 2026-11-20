import { Platform } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { fetchWidgetRates } from '@/services/ratesApi';
import type { UnifiedRates } from '@/types/currency.types';
import { buildUnifiedRatesFromApi } from '@/utils/ratesTransform';
import { buildRatesWidgetRepresentation } from '@/widgets/RatesWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === 'WIDGET_DELETED') {
    return;
  }

  let rates: UnifiedRates | null = null;
  try {
    const force =
      props.widgetAction === 'WIDGET_CLICK' && props.clickAction === 'REFRESH';
    const { today, recent } = await fetchWidgetRates(force);
    rates = buildUnifiedRatesFromApi(today.rates, recent.rates).rates;
  } catch {
    rates = null;
  }

  props.renderWidget(
    buildRatesWidgetRepresentation(props.widgetInfo.widgetName, rates),
  );
}

/** Push latest in-app rates immediately to all pinned Android widgets. */
export async function syncWidgetsWithRates(rates: UnifiedRates): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const widgetName of ['RatesSmall', 'RatesMedium'] as const) {
    try {
      await requestWidgetUpdate({
        widgetName,
        renderWidget: () => buildRatesWidgetRepresentation(widgetName, rates),
      });
    } catch {
      // Ignore if native widget module isn't linked (e.g. web or Expo Go)
    }
  }
}
