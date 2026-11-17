# AGENTS.md — RatesVenApp Context

> Canonical AI context file. Linked by [CLAUDE.md](CLAUDE.md) via `@AGENTS.md`.

<gates>
EXPO_DOCS:
  trigger: any-code-change
  rule: Expo SDK 57 (`expo ~57.0.20`, `react 19.2.3`, `react-native 0.86.3`) has breaking changes vs older SDKs. Verify APIs at https://docs.expo.dev/versions/v57.0.0/ before writing code.

SECRETS:
  rule: Never hardcode or commit `EXPO_PUBLIC_RATES_API_KEY` into tracked files (`src/`, `eas.json`, `app.json`). Keep secrets only in `.env` (gitignored) or EAS environment secrets.

REACT_COMPILER:
  rule: `experiments.reactCompiler: true` is active in `app.json`. Never read/write `ref.current` during render; keep hooks pure.
</gates>

<project>
name: RatesVenApp (`new-rates-app`)
purpose: Venezuelan exchange rate converter (USD BCV, EUR BCV, USDT Yadio, VES) + historical price charts + offline cache.
pkg_manager: pnpm (`pnpm-lock.yaml`)
path_aliases: `@/*` -> `./src/*` | `@/assets/*` -> `./assets/*`
stack:
  framework: Expo SDK 57 + Expo Router (`~57.0.19`, typedRoutes)
  ui: NativeWind v4 (`tailwindcss ^3.4.19`) + `react-native-reanimated 4.5.1` + `lucide-react-native` + `react-native-gifted-charts`
  fonts: `@expo-google-fonts/poppins` (`Poppins_100Thin` .. `Poppins_900Black`)
  state: Zustand (`src/store/currencyStore.ts`) + TanStack Query v5 (`PersistQueryClientProvider`)
  network: `fetch` + `@react-native-community/netinfo` + `@react-native-async-storage/async-storage`
</project>

<file_map>
entry_and_routes:
  src/app/_layout.tsx: Root layout, Poppins font loading, QueryClient + AsyncStorage persister, NetInfo -> React Query `onlineManager`, theme sync
  src/app/(tabs)/_layout.tsx: Bottom tabs with `CustomTabBar` (`headerShown: false` across tabs; left: `history`, center FAB: `index`, right: `settings`)
  src/app/(tabs)/index.tsx: Main screen — `RatesHero` + active `CurrencyInput` + 3 `RateCard`s (all 4 currencies always visible), 300ms input debounce, immediate card swap
  src/app/(tabs)/history.tsx: Compact `ScreenHero` with embedded `CurrencyTabSelector`, animated `PeriodSelector` (`1d|3d|7d|30d`), sliding content transitions, chart, stats row, chronological price list
  src/app/(tabs)/settings.tsx: Compact `ScreenHero`, bordered grouped cards with header accents and inset row dividers, theme mode (`dark|light|system`), force refresh, cache clear

services_and_data:
  src/services/ratesApi.ts: Cloudflare API client, `X-API-Key` auth, NetInfo pre-check, AsyncStorage fallback cache, in-flight dedupe, 10s AbortController timeout
  src/types/currency.types.ts: API DTOs (`ApiCurrency`, `ApiRateRecord`, `ApiTodayRateRecord`, etc.) and app domain types (`CurrencyCode`, `UnifiedRates`, `ChartDataPoint`)
  src/utils/constants.ts: Env config (`RATES_API_URL`, `RATES_API_KEY`), `CURRENCY_TO_API`, React Query keys, cache TTLs (`5m` stale / `7d` GC), currency metadata, `THEME_COLORS`
  src/utils/formatters.ts: `es-VE` number formatters, `date-fns` Spanish formatters, `formatInputValue`, `parseFormattedNumber`
  src/store/currencyStore.ts: Zustand store (`selectedCurrency`, `amount`, `themeMode`)

hooks:
  src/hooks/useCurrencyRates.ts: Fetches `today` + `recent` rates, computes `UnifiedRates`, `%` variation (`pctChange`), `hasFallback`, `refetch` (expires cache TTL first)
  src/hooks/useHistoricalRates.ts: Fetches 30d history once per currency, filters `1d|3d|7d|30d` locally, handles weekend BCV fallback
  src/hooks/useConversion.ts: Pure `convertAmount()` helper + `useConversion()` hook (VES as common pivot)
  src/hooks/useOfflineStatus.ts: NetInfo subscription + initial `NetInfo.fetch()` returning `{ isOnline, lastOnline }`
  src/hooks/useThemeColors.ts: Resolves `THEME_COLORS.light|dark` from Zustand `themeMode` + system scheme

components_ui:
  src/components/ui/RatesHero.tsx: Edge-to-edge fixed orange (`COLORS.primary`) rounded-bottom (`28px`) Hero with `OfflineBadge` and 3 quick-verify cards (USD, EUR, USDT)
  src/components/ui/ScreenHero.tsx: Compact fixed edge-to-edge orange (`COLORS.primary`) rounded-bottom (`26px`) Hero with icon, title, subtitle, and optional children (used in `history` and `settings`)
  src/components/ui/Card.tsx: Shared flat card container (`rounded-2xl bg-surface-card p-4`, no shadow) with optional header (`title`, `icon`, `headerRight`) used across `history`, `settings`, and `CurrencyInput`
  src/components/ui/CustomTabBar.tsx: Curved SVG (`#ff6b26`) bottom tab bar with center concave notch, white circular FAB (`index`) with `withTiming` scale-90->100 press animation, and `useSafeAreaInsets().bottom` handling
  src/components/ui/CurrencyInput.tsx: Active currency input, fixed `52px` height, right-side reset-to-1 (`X`) button, comma-to-dot normalization
  src/components/ui/RateCard.tsx: Conversion card with press scale animation, `%` badge (hidden for `VES`), `1 X = Y VES` subtitle
  src/components/ui/OfflineBadge.tsx: Offline indicator pill (`variant: 'default' | 'hero'`)
  src/components/ui/EmptyState.tsx: Animated empty/error card with retry CTA
  src/components/ui/CurrencyTabSelector.tsx: `CurrencyTabSelector` + `PeriodSelector` for History screen
  src/components/ui/PriceChart.tsx: `LineChart` wrapper with dynamic Y-axis padding and pointer tooltip
  src/components/ui/PriceHistoryList.tsx: Reverse-chronological rate log with delta `%`
  src/components/ui/StatsRow.tsx: Actual / Max / Min / Variation summary card

config:
  app.json: Expo config (`android.package: com.devlopez.ratesvenapp`, `ios.bundleIdentifier: com.devlopez.ratesvenapp`)
  eas.json: EAS build profiles (`development`, `preview` [APK], `production` [APK], `production-aab` [AAB])
  tailwind.config.js & src/global.css: Theme tokens + Poppins weight-to-fontFamily mapping
</file_map>

<api_contract source="https://github.com/jose1937JS/rates-cloudflare">
base_url: `EXPO_PUBLIC_RATES_API_URL` (default `https://rates-api.dev-lopezjose.workers.dev`)
auth: Header `X-API-Key: <EXPO_PUBLIC_RATES_API_KEY>`
rate_limit: `10` requests / `60s` per IP on Cloudflare Worker — minimize calls, never remove caching/dedupe
cors: Native apps send no `Origin` (allowed); web requests require Worker `ALLOWED_ORIGINS` allowlist

endpoints:
  GET /api/rates/today: Latest `BCV_USD`, `BCV_EUR`, `YD_USD` in `America/Caracas` with `isFallback: true` on weekends/holidays
  GET /api/rates?page=1&limit=60&days=7: Recent rates across all currencies (used for `%` change vs previous entry)
  GET /api/rates/:currency: Latest single record (`BCV_USD | BCV_EUR | YD_USD`)
  GET /api/rates/:currency/all?page=1&limit=100&days=30: Paginated currency history (`YD_USD` runs every 4h -> ~180 rows/30d, `fetchCurrencyHistory` fetches max 2 pages)
  POST /api/sync?source=all|bcv|yadio: Triggers scraping + D1 insert — do NOT call automatically on mount/refresh
</api_contract>

<invariants_and_gotchas>
startup_state:
  rule: App MUST always launch with `selectedCurrency: 'USD'` and `amount: '1'`.
  detail: `currencyStore.ts` `partialize` persists ONLY `themeMode`. Do NOT persist `selectedCurrency` or `amount`.

all_currencies_visible:
  rule: Converter screen MUST always render all 4 currencies (`USD`, `EUR`, `USDT`, `VES`) — 1 in `CurrencyInput` + 3 `RateCard`s below (`VES` first when not selected). Never filter out `USD`/`EUR` if a rate is `0`; show `"--"` / `"Tasa no disponible"`.

debounce_and_clear:
  typing: `inputValue` updates synchronously on `onChangeText`; `debouncedAmount` updates after `300ms` (`DEBOUNCE_MS`).
  card_tap: `handleCardPress` cancels pending debounce timer and computes via `convertAmount()` using immediate `inputValue`.
  clear_button: Visible in `CurrencyInput` when `value.length > 0 && value !== '1'`; tapping resets input and `debouncedAmount` immediately to `'1'`.

textinput_clipping_fix:
  rule: Keep `TextInput` in `CurrencyInput.tsx` with explicit `height: 52`, `fontSize: 30`, `fontFamily: 'Poppins_700Bold'`, `paddingVertical: 0`, `textAlignVertical: 'center'`, `includeFontPadding: false`.
  why: Adding NativeWind `text-3xl` sets `lineHeight: 36`, which clips/shifts the `"0.00"` placeholder upward when empty.

number_parsing_bug_trap:
  rule: `CurrencyInput` stores standard dot-decimal strings (`"914.02"`), while `formatInputValue` adds comma thousands (`"1,000.50"`). `parseFormattedNumber()` must preserve single-`.` decimals (never strip all dots blindly like `.replace(/\./g, '')`, or `"914.02"` turns into `91402`).

offline_and_cache:
  connectivity: Use `Boolean(state.isConnected) && state.isInternetReachable !== false` (`isInternetReachable` can initialize as `null`).
  query_mode: `QueryClient` uses `networkMode: 'offlineFirst'`, `refetchOnWindowFocus: false`, `retry: 1`.
  fallback: `ratesApi.ts` checks `isNetworkOnline()` before fetching; if offline or on `429`/`5xx`/timeout, returns last saved `AsyncStorage` entry (`@ratesvenapp/api_cache:*`). `expireApiCache()` sets `cachedAt: 0` without deleting fallback data; `clearApiCache()` deletes cache keys while leaving Zustand theme intact.

history_intraday_keys:
  rule: `YD_USD` has ~6 records/day. Keep full ISO `created_at` in `ChartDataPoint.date` and key `PriceHistoryList` items by `item.id` (never `YYYY-MM-DD` alone).

fonts_and_hero_layout:
  poppins: `tailwind.config.js` resets `fontWeight` to `'normal'` and `src/global.css` maps `.font-medium`/`.font-bold`/etc. to `Poppins_*` files for Android compatibility.
  hero_safe_area: `index.tsx` uses `contentInsetAdjustmentBehavior="never"` on `ScrollView` so `RatesHero` sits flush behind the status bar using `useSafeAreaInsets().top`.
</invariants_and_gotchas>

<commands>
dev:
  `pnpm start` | `pnpm android` | `pnpm ios` | `pnpm web`
validation:
  `pnpm typecheck` (`tsc --noEmit`) — run after every code edit
  note: `pnpm lint` (`expo lint`) currently prompts interactively (no ESLint config installed)
eas_apk_builds:
  `pnpm build:apk` (`eas build --platform android --profile preview`)
  `pnpm build:apk:local` (uses local `.env`)
  `pnpm build:apk:prod` | `pnpm build:apk:prod:local` | `pnpm build:aab`
  note: Remote EAS builds require `eas init` (sets `extra.eas.projectId`) and `EXPO_PUBLIC_RATES_API_KEY` pushed to EAS env (`eas env:push`) since `.env` is gitignored.
</commands>
