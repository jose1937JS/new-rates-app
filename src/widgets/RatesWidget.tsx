'use no memo';

import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import type { UnifiedRates } from '@/types/currency.types';
import { formatChartTime, formatNumber, formatPercentage } from '@/utils/formatters';

const APP_LOGO = require('../../assets/images/logo.webp');

interface WidgetPalette {
  bg: `#${string}`;
  cardBg: `#${string}`;
  primary: `#${string}`;
  textPrimary: `#${string}`;
  textMuted: `#${string}`;
  success: `#${string}`;
  danger: `#${string}`;
  border: `#${string}`;
}

const LIGHT_PALETTE: WidgetPalette = {
  bg: '#ffffff',
  cardBg: '#f6f7f9',
  primary: '#ff6b26',
  textPrimary: '#111827',
  textMuted: '#6b7280',
  success: '#16a34a',
  danger: '#dc2626',
  border: '#e5e7eb',
};

const DARK_PALETTE: WidgetPalette = {
  bg: '#1c1c1e',
  cardBg: '#2a2a2e',
  primary: '#ff7a3d',
  textPrimary: '#f9fafb',
  textMuted: '#9ca3af',
  success: '#4ade80',
  danger: '#f87171',
  border: '#38383c',
};

function renderEmptyWidget(palette: WidgetPalette) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg,
        borderRadius: 20,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget
        text="RATESVEN"
        style={{
          fontSize: 13,
          fontWeight: 'bold',
          color: palette.primary,
        }}
      />
      <TextWidget
        text="Toca para cargar las tasas"
        style={{
          fontSize: 11,
          color: palette.textMuted,
          marginTop: 4,
        }}
      />
    </FlexWidget>
  );
}

function SmallWidgetContent({
  rates,
  palette,
}: {
  rates: UnifiedRates | null;
  palette: WidgetPalette;
}) {
  if (!rates) return renderEmptyWidget(palette);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="RatesVen tasas del día"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg,
        borderRadius: 20,
        padding: 12,
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 5,
          }}
        >
          <ImageWidget
            image={APP_LOGO}
            imageWidth={15}
            imageHeight={15}
            resizeMode="contain"
          />
          <TextWidget
            text="RATESVEN"
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: palette.primary,
            }}
          />
        </FlexWidget>

        <TextWidget
          text="↻"
          clickAction="REFRESH"
          accessibilityLabel="Actualizar tasas"
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: palette.textMuted,
            paddingHorizontal: 4,
          }}
        />
      </FlexWidget>

      {/* USD BCV & USDT */}
      <FlexWidget style={{ width: 'match_parent', flexGap: 6 }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: palette.cardBg,
            borderRadius: 10,
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}
        >
          <TextWidget
            text="BCV $"
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: palette.textMuted,
            }}
          />
          <TextWidget
            text={
              rates.usd.rateToVes > 0
                ? `${formatNumber(rates.usd.rateToVes, 2)} Bs`
                : '--'
            }
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: palette.textPrimary,
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: palette.cardBg,
            borderRadius: 10,
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}
        >
          <TextWidget
            text="USDT"
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: palette.textMuted,
            }}
          />
          <TextWidget
            text={
              rates.usdt.rateToVes > 0
                ? `${formatNumber(rates.usdt.rateToVes, 2)} Bs`
                : '--'
            }
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: palette.textPrimary,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

function MediumWidgetContent({
  rates,
  palette,
}: {
  rates: UnifiedRates | null;
  palette: WidgetPalette;
}) {
  if (!rates) return renderEmptyWidget(palette);

  const updatedLabel = rates.lastUpdated
    ? formatChartTime(rates.lastUpdated.toISOString())
    : '';

  const columns = [
    {
      label: 'USD',
      source: 'BCV',
      rate: rates.usd.rateToVes,
      change: rates.usd.changePercentage,
    },
    {
      label: 'EUR',
      source: 'BCV',
      rate: rates.eur.rateToVes,
      change: rates.eur.changePercentage,
    },
    {
      label: 'USDT',
      source: 'Yadio',
      rate: rates.usdt.rateToVes,
      change: rates.usdt.changePercentage,
    },
  ];

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="RatesVen resumen completo de tasas"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg,
        borderRadius: 22,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 7,
          }}
        >
          <ImageWidget
            image={APP_LOGO}
            imageWidth={18}
            imageHeight={18}
            resizeMode="contain"
          />
          <TextWidget
            text="RATESVEN"
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: palette.primary,
            }}
          />
        </FlexWidget>

        <FlexWidget
          clickAction="REFRESH"
          accessibilityLabel="Actualizar tasas"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.cardBg,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexGap: 5,
          }}
        >
          {updatedLabel ? (
            <TextWidget
              text={updatedLabel}
              style={{ fontSize: 10, color: palette.textMuted }}
            />
          ) : null}
          <TextWidget
            text="↻"
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: palette.primary,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 3 Rate Columns */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          flexGap: 8,
        }}
      >
        {columns.map((col) => {
          const isPositive = col.change >= 0;
          return (
            <FlexWidget
              key={col.label}
              style={{
                flex: 1,
                backgroundColor: palette.cardBg,
                borderRadius: 14,
                paddingHorizontal: 8,
                paddingVertical: 10,
                justifyContent: 'space-between',
              }}
            >
              <FlexWidget
                style={{
                  width: 'match_parent',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <TextWidget
                  text={col.label}
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: palette.textPrimary,
                  }}
                />
                <TextWidget
                  text={col.source}
                  style={{
                    fontSize: 9,
                    color: palette.textMuted,
                  }}
                />
              </FlexWidget>

              <TextWidget
                text={col.rate > 0 ? `${formatNumber(col.rate, 2)} Bs` : '--'}
                maxLines={1}
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  adjustsFontSizeToFit: true,
                  color: palette.textPrimary,
                  marginTop: 6,
                }}
              />

              <TextWidget
                text={formatPercentage(col.change)}
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isPositive ? palette.success : palette.danger,
                  marginTop: 3,
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}

export function buildRatesWidgetRepresentation(
  widgetName: string,
  rates: UnifiedRates | null,
) {
  if (widgetName === 'RatesSmall') {
    return {
      light: <SmallWidgetContent rates={rates} palette={LIGHT_PALETTE} />,
      dark: <SmallWidgetContent rates={rates} palette={DARK_PALETTE} />,
    };
  }
  return {
    light: <MediumWidgetContent rates={rates} palette={LIGHT_PALETTE} />,
    dark: <MediumWidgetContent rates={rates} palette={DARK_PALETTE} />,
  };
}
