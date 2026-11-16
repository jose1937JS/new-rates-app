parse.bot API Key for binance p2p ads 
pmx_ea7783e6e0123880114df02f0b42553b


# Documentación de Endpoints y APIs

Esta documentación detalla todos los endpoints consumidos por la aplicación, sus métodos, parámetros, cabeceras de autenticación, interfaces de TypeScript y ejemplos de respuestas JSON.

## Índice

1. [Configuración General](#configuración-general)
   - [Variables de Entorno](#variables-de-entorno)
   - [Autenticación](#autenticación)
   - [Estrategia de Caché y Persistencia](#estrategia-de-caché-y-persistencia)
2. [Endpoints del CDN (BCV - Banco Central de Venezuela)](#1-endpoints-del-cdn-bcv)
   - [GET /bcv/current.json](#11-tasa-actual-del-bcv-usd-y-eur)
   - [GET /bcv/{year}/{month}/list.json](#12-histórico-mensual-del-bcv)
3. [Endpoints de la API (USDT - Mercado P2P)](#2-endpoints-de-la-api-usdt)
   - [GET /public/usdt/exchange-rate](#21-tasa-actual-de-usdt)
   - [GET /public/usdt/exchange-rate/list](#22-histórico-de-usdt-por-rango-de-fechas)
4. [Mapeo y Consumo en la Aplicación](#3-mapeo-y-consumo-en-la-aplicación)

---

## Configuración General

La aplicación utiliza dos orígenes de datos complementarios:
1. **Red de Distribución de Contenido (CDN)**: Para tasas oficiales del BCV en formato estático de alta velocidad y sin necesidad de API Key.
2. **API REST de DolarVzla**: Para tasas en tiempo real e históricos de USDT con autenticación mediante API Key en cabeceras.

### Variables de Entorno

| Variable | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_RATES_CDN_URL` | `https://rates.dolarvzla.com` | URL base para el CDN de tasas estáticas |
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.dolarvzla.com` | URL base para la API REST |
| `EXPO_PUBLIC_DOLARVZLA_API_KEY` | *(Secret Token)* | API Key enviada en las peticiones a la API REST |

### Autenticación

Las peticiones al CDN no requieren autenticación (CORS abierto).
Las peticiones a la API REST requieren la cabecera:

```http
x-dolarvzla-key: <EXPO_PUBLIC_DOLARVZLA_API_KEY>
```

### Estrategia de Caché y Persistencia

Implementado mediante `@tanstack/react-query` y `@tanstack/query-async-storage-persister`:
* **`staleTime`**: `5 minutos` (300,000 ms) — Datos frescos en memoria sin refetch.
* **`gcTime`**: `7 días` (604,800,000 ms) — Conservación en caché offline para acceso sin conexión.
* **Persistencia local**: Clave `ratesvenapp_cache` en `@react-native-async-storage/async-storage`.

---

## 1. Endpoints del CDN (BCV)

### 1.1 Tasa Actual del BCV (USD y EUR)

Obtiene las tasas oficiales vigentes del Banco Central de Venezuela junto con la tasa del día anterior hábil y la variación porcentual calculada.

* **Método**: `GET`
* **URL**: `https://rates.dolarvzla.com/bcv/current.json`
* **Autenticación**: Ninguna (Público)
* **Función en código**: `fetchBcvCurrent()` en `src/services/dolarVzlaApi.ts`
* **Hook**: `useCurrencyRates()` en `src/hooks/useCurrencyRates.ts`
* **Query Key**: `['currency', 'bcv', 'current']`

#### Definición de Tipos (TypeScript)

```typescript
export interface BcvRate {
  usd: number;
  eur: number;
  date: string; // Formato ISO "YYYY-MM-DD"
}

export interface BcvCurrentResponse {
  current: BcvRate;
  previous: BcvRate;
  changePercentage: {
    usd: number;
    eur: number;
  };
}
```

#### Ejemplo de Respuesta JSON

```json
{
  "current": {
    "usd": 73.45,
    "eur": 79.12,
    "date": "2026-09-08"
  },
  "previous": {
    "usd": 73.20,
    "eur": 78.95,
    "date": "2026-09-07"
  },
  "changePercentage": {
    "usd": 0.34,
    "eur": 0.22
  }
}
```

---

### 1.2 Histórico Mensual del BCV

Obtiene todos los registros diarios de las tasas del BCV correspondientes a un año y mes específicos. Los registros vienen ordenados de forma descendente por fecha.

* **Método**: `GET`
* **URL**: `https://rates.dolarvzla.com/bcv/{year}/{month}/list.json`
* **Autenticación**: Ninguna (Público)
* **Parámetros de Ruta**:
  * `year` *(number)*: Año en 4 dígitos (ej. `2026`).
  * `month` *(number)*: Mes en número entero entre `1` y `12` (ej. `9`).
* **Función en código**: `fetchBcvMonthly(year: number, month: number)` en `src/services/dolarVzlaApi.ts`
* **Hook**: `useHistoricalRates(currency, period)` en `src/hooks/useHistoricalRates.ts`
* **Query Key**: `['currency', 'bcv', 'monthly', year, month]`

#### Definición de Tipos (TypeScript)

```typescript
export interface BcvRate {
  usd: number;
  eur: number;
  date: string; // Formato ISO "YYYY-MM-DD"
}

export type BcvMonthlyResponse = BcvRate[];
```

#### Ejemplo de Respuesta JSON

```json
[
  {
    "usd": 73.45,
    "eur": 79.12,
    "date": "2026-09-08"
  },
  {
    "usd": 73.20,
    "eur": 78.95,
    "date": "2026-09-07"
  },
  {
    "usd": 72.85,
    "eur": 78.50,
    "date": "2026-09-05"
  },
  {
    "usd": 72.50,
    "eur": 78.10,
    "date": "2026-09-04"
  }
]
```

---

## 2. Endpoints de la API (USDT)

### 2.1 Tasa Actual de USDT

Obtiene los precios de compra, venta y promedio de USDT en el mercado venezolano en tiempo real, junto con la comparación previa y variación porcentual.

* **Método**: `GET`
* **URL**: `https://api.dolarvzla.com/public/usdt/exchange-rate`
* **Autenticación**: Requerida (`x-dolarvzla-key`)
* **Función en código**: `fetchUsdtRate()` en `src/services/dolarVzlaApi.ts`
* **Hook**: `useCurrencyRates()` en `src/hooks/useCurrencyRates.ts`
* **Query Key**: `['currency', 'usdt', 'current']`

#### Cabeceras de Petición

```http
GET /public/usdt/exchange-rate HTTP/1.1
Host: api.dolarvzla.com
x-dolarvzla-key: 7e9d6896f0ef208c849a271156e5f588a452f4edc9541c772eb34679212a24fd
Accept: application/json
```

#### Definición de Tipos (TypeScript)

```typescript
export interface UsdtExchangeRate {
  buy: number;
  sell: number;
  average: number;
  date: string; // Formato ISO Timestamp
}

export interface UsdtExchangeRateResponse {
  current: UsdtExchangeRate;
  previous?: UsdtExchangeRate;
  changePercentage: {
    buy: number;
    sell: number;
    average: number;
  };
}
```

#### Ejemplo de Respuesta JSON

```json
{
  "current": {
    "buy": 74.80,
    "sell": 75.30,
    "average": 75.05,
    "date": "2026-09-08T18:30:00.000Z"
  },
  "previous": {
    "buy": 74.50,
    "sell": 75.00,
    "average": 74.75,
    "date": "2026-09-08T12:00:00.000Z"
  },
  "changePercentage": {
    "buy": 0.40,
    "sell": 0.40,
    "average": 0.40
  }
}
```

---

### 2.2 Histórico de USDT por Rango de Fechas

Obtiene la serie temporal histórica de tasas promedio, compra y venta de USDT entre dos fechas dadas.

* **Método**: `GET`
* **URL**: `https://api.dolarvzla.com/public/usdt/exchange-rate/list`
* **Autenticación**: Requerida (`x-dolarvzla-key`)
* **Parámetros de Consulta (Query Params)**:
  * `from` *(string, requerido)*: Fecha inicial en formato `YYYY-MM-DD` (ej. `2026-08-09`).
  * `to` *(string, requerido)*: Fecha final en formato `YYYY-MM-DD` (ej. `2026-09-08`).
* **Función en código**: `fetchUsdtHistory(from: string, to: string)` en `src/services/dolarVzlaApi.ts`
* **Hook**: `useHistoricalRates(currency, period)` en `src/hooks/useHistoricalRates.ts`
* **Query Key**: `['currency', 'usdt', 'history', from, to]`

#### Cabeceras de Petición

```http
GET /public/usdt/exchange-rate/list?from=2026-08-09&to=2026-09-08 HTTP/1.1
Host: api.dolarvzla.com
x-dolarvzla-key: 7e9d6896f0ef208c849a271156e5f588a452f4edc9541c772eb34679212a24fd
Accept: application/json
```

#### Definición de Tipos (TypeScript)

```typescript
export interface UsdtHistoricalRate {
  buy: number;
  sell: number;
  average: number;
  date: string; // Formato ISO "YYYY-MM-DD" o Timestamp
}

export interface UsdtHistoricalRatesResponse {
  rates: UsdtHistoricalRate[];
}
```

#### Ejemplo de Respuesta JSON

```json
{
  "rates": [
    {
      "buy": 74.80,
      "sell": 75.30,
      "average": 75.05,
      "date": "2026-09-08"
    },
    {
      "buy": 74.50,
      "sell": 75.00,
      "average": 74.75,
      "date": "2026-09-07"
    },
    {
      "buy": 74.10,
      "sell": 74.60,
      "average": 74.35,
      "date": "2026-09-06"
    }
  ]
}
```

---

## 3. Mapeo y Consumo en la Aplicación

### Estructura Unificada en la App (`UnifiedRates`)

En `useCurrencyRates.ts`, las respuestas de los endpoints `fetchBcvCurrent()` y `fetchUsdtRate()` se normalizan en la siguiente estructura consumida por los componentes de UI:

```typescript
export interface CurrencyRate {
  code: CurrencyCode;         // 'USD' | 'EUR' | 'USDT' | 'VES'
  rateToVes: number;          // Tasa de cambio hacia Bolívares
  changePercentage: number;   // Porcentaje de variación (+0.34 o -0.15)
  lastUpdated: string;        // Fecha de última actualización
}

export interface UnifiedRates {
  usd: CurrencyRate;
  eur: CurrencyRate;
  usdt: CurrencyRate;
  lastUpdated: Date;
}
```

### Flujo de Datos por Pantalla

1. **Pantalla Principal (`src/app/(tabs)/index.tsx`)**:
   - Consume `useCurrencyRates()`.
   - Muestra tarjetas de conversión ([RateCard](file:///Users/lopez/PROJECTS/new-rates-app/src/components/ui/RateCard.tsx)) para USD, EUR y USDT.
   - Provee la tasa de cambio activa para la calculadora de conversión en tiempo real.

2. **Pantalla de Historial (`src/app/(tabs)/history.tsx`)**:
   - Consume `useHistoricalRates(currency, period)`.
   - Rango de períodos: `1d`, `3d`, `7d`, `30d`.
   - Para **USD** y **EUR**: Consume `fetchBcvMonthly` (y el mes anterior si el rango cruza cambio de mes).
   - Para **USDT**: Consume `fetchUsdtHistory(from, to)`.
   - Alimenta el gráfico interactivo ([PriceChart](file:///Users/lopez/PROJECTS/new-rates-app/src/components/ui/PriceChart.tsx)), las estadísticas ([StatsRow](file:///Users/lopez/PROJECTS/new-rates-app/src/components/ui/StatsRow.tsx)) y la lista cronológica detallada ([PriceHistoryList](file:///Users/lopez/PROJECTS/new-rates-app/src/components/ui/PriceHistoryList.tsx)).

3. **Manejo de Errores de Red / Modo Offline**:
   - Clase centralizada `ApiError` en `src/services/dolarVzlaApi.ts`.
   - Monitoreo en vivo vía `@react-native-community/netinfo` ([useOfflineStatus](file:///Users/lopez/PROJECTS/new-rates-app/src/hooks/useOfflineStatus.ts)).
   - Fallback automático a los datos en caché local persistidos en `AsyncStorage`.
