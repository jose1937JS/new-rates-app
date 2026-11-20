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
purpose: Venezuelan exchange rate converter (USD BCV, EUR BCV, USDT Yadio, VES), historical price charts, offline cache, onboarding, and multi-currency shopping budget calculator.
pkg_manager: pnpm (`pnpm-lock.yaml`)
path_aliases: `@/*` -> `./src/*` | `@/assets/*` -> `./assets/*`
stack:
  framework: Expo SDK 57 + Expo Router (`~57.0.19`, typedRoutes)
  ui: NativeWind v4 (`tailwindcss ^3.4.19`) + `react-native-reanimated 4.5.1` + `react-native-gesture-handler ~2.32.0` + `react-native-pager-view 8.0.2` + `react-native-svg ^15.15.4` + `lucide-react-native` + `react-native-gifted-charts`
  fonts: `@expo-google-fonts/poppins` (`Poppins_100Thin` .. `Poppins_900Black`)
  state: Zustand (`src/store/currencyStore.ts`, `src/store/shoppingStore.ts`) + TanStack Query v5 (`PersistQueryClientProvider`)
  network: `fetch` + `@react-native-community/netinfo` + `@react-native-async-storage/async-storage`
</project>

<file_map>
entry_and_routes:
  src/app/_layout.tsx: Root layout, Poppins font loading, NativeWind primary `vars()`, `AnimatedSplashOverlay` gated on `fontsLoaded && storeHydrated`, onboarding gate (`!hasCompletedOnboarding`), `Stack` (`(tabs)`, `shopping/index`, `shopping/[id]`), QueryClient + AsyncStorage persister, NetInfo -> React Query `onlineManager`
  src/app/(tabs)/_layout.tsx: Bottom tabs with `CustomTabBar` (`headerShown: false`; left: `history`, center FAB: `index`, right: `settings`)
  src/app/(tabs)/index.tsx: Main converter — full-screen first-load `ConverterSkeleton`, `RatesHero` + `PullToRefreshScrollView` + `CurrencyInput` + 3 `RateCard`s (all 4 currencies visible) + `ShoppingEntryCard`, 300ms input debounce, immediate card swap, clean `ScreenHero` + `EmptyState` on error/empty
  src/app/(tabs)/history.tsx: Fixed compact `ScreenHero` with `CurrencyTabSelector`, left/right horizontal swipe between `USD|EUR|USDT`, `PullToRefreshScrollView`, `PeriodSelector` (`1d|3d|7d|30d`), `PriceChart`, `StatsRow`, `PriceHistoryList`
  src/app/(tabs)/settings.tsx: Fixed compact `ScreenHero`, flat `Card` groups, theme mode (`dark|light|system`), 6-color primary picker (`orange|blue|emerald|violet|rose|gold`), force refresh, cache clear, `AppModal` dialogs
  src/app/shopping/index.tsx: Shopping lists hub — active in-progress purchases, completed purchase history, create list modal (`ListSettingsModal`), delete confirmation via `AppModal`
  src/app/shopping/[id].tsx: Dual-mode shopping screen — active calculator (live multi-currency total switcher, budget limit progress bar, `ProductFormCard`, `ShoppingItemRow` +/-/edit/delete, `"Finalizar y guardar compra"`) and completed detail (`ActualPaidCard` with diff vs calculated total, itemized breakdown, `"Editar lista"`)

services_and_data:
  src/services/ratesApi.ts: Cloudflare API client, `X-API-Key` auth, NetInfo pre-check, AsyncStorage fallback cache, in-flight dedupe, 10s AbortController timeout
  src/types/currency.types.ts: API DTOs, app domain types (`CurrencyCode`, `UnifiedRates`, `ChartDataPoint`, `PrimaryColorId`), and shopping types (`ShoppingRatesSnapshot`, `ShoppingItem`, `ShoppingList`)
  src/utils/constants.ts: Env config (`RATES_API_URL`, `RATES_API_KEY`), `CURRENCY_TO_API`, React Query keys, cache TTLs (`5m` stale / `7d` GC), currency metadata, `PRIMARY_COLOR_OPTIONS`, `THEME_COLORS`, `APP_VERSION`
  src/utils/formatters.ts: `es-VE` number formatters, `date-fns` Spanish formatters, `formatInputValue`, `parseFormattedNumber`
  src/utils/shoppingUtils.ts: Pure multi-currency shopping helpers (`convertShoppingAmount`, `getListTotals`, `evaluateBudget`, `compareActualPaid`, `sanitizeDecimalInput`)
  src/store/currencyStore.ts: Zustand store (`selectedCurrency`, `amount`, `themeMode`, `primaryColor`, `hasCompletedOnboarding`) with `'teal' -> 'gold'` rehydration migration
  src/store/shoppingStore.ts: Zustand store persisted in AsyncStorage (`ratesvenapp_shopping_lists`) managing lists, items, quantities, budgets, and actual paid amounts

hooks:
  src/hooks/useCurrencyRates.ts: Fetches `today` + `recent` rates, respects `useIsRestoring()`, computes `UnifiedRates`, `%` variation, `hasFallback`, `refetch`
  src/hooks/useHistoricalRates.ts: Fetches 30d history once per currency, deduplicates by `id`, filters `1d|3d|7d|30d` locally, formats non-repetitive intraday/daily X-axis labels
  src/hooks/useConversion.ts: Pure `convertAmount()` helper + `useConversion()` hook (VES as common pivot)
  src/hooks/useOfflineStatus.ts: NetInfo subscription + initial `NetInfo.fetch()` returning `{ isOnline, lastOnline }`
  src/hooks/useThemeColors.ts: Syncs NativeWind + RN color schemes and resolves darker `primaryDark`/`rgbDark` in dark mode vs bright `primary`/`rgb` in light mode

components_ui:
  src/components/ui/RatesHero.tsx: Edge-to-edge fixed primary-colored rounded-bottom (`28px`) Hero with `logo.png` + `RATES VENAPP`, `OfflineBadge`, and 3 pressable rate cards opening plain-Spanish calculation `AppModal` dialogs
  src/components/ui/ScreenHero.tsx: Compact fixed primary-colored rounded-bottom (`26px`) Hero with optional `leftAction`, `icon`, `showLogo` (default `false`), `rightElement`, and `children`
  src/components/ui/ConverterSkeleton.tsx: Full-screen pulsing skeleton rendered exclusively during first-ever load on `index.tsx`
  src/components/ui/ThreeDotsLoader.tsx: Reanimated 3-dot bouncing loader (`size`, `color`, `colors`, `gap`) replacing `ActivityIndicator` everywhere
  src/components/ui/PullToRefreshScrollView.tsx: Custom RNGH + Reanimated pull-to-refresh scroll container with high drag threshold (`PULL_DEAD_ZONE = 200`, `PULL_TRIGGER_DISTANCE = 380`) to prevent accidental API calls
  src/components/ui/CurrencyIcon.tsx: Renders `assets/images/usdt-icon.png` for `USDT` and flag emojis for `USD`/`EUR`/`VES`
  src/components/ui/AppModal.tsx: Custom themed confirmation/info modal (`primary` color for `info`/`success`, `danger` color for `danger`/`warning`, `ThreeDotsLoader` when `loading`)
  src/components/ui/AnimatedSplashOverlay.tsx: Orange (`#ff6b26`) animated splash overlay with logo pulse, progress bar, and `ThreeDotsLoader`
  src/components/ui/Card.tsx: Shared flat card container (`rounded-2xl bg-surface-card p-4`) with optional header
  src/components/ui/CustomTabBar.tsx: Curved SVG (`COLORS.primary`) bottom tab bar with center concave notch and primary-colored circular FAB (`index`) with white icon
  src/components/ui/CurrencyInput.tsx: Active currency input, fixed `52px` height, `X` button clearing input to `''` for fast typing, comma-to-dot normalization
  src/components/ui/RateCard.tsx: Conversion card with press scale animation, `%` badge (hidden for `VES`), `1 X = Y VES` subtitle
  src/components/ui/OfflineBadge.tsx: Online/offline pill (`"Conectado"` in green / `"Sin conexión"` in red; `variant: 'default' | 'hero'`)
  src/components/ui/EmptyState.tsx: Animated empty/error card with retry CTA
  src/components/ui/CurrencyTabSelector.tsx: `CurrencyTabSelector` + `PeriodSelector` for History screen
  src/components/ui/PriceChart.tsx: `LineChart` wrapper with `yAxisOffset`-adjusted `maxValue`, horizontal scroll (`activatePointersOnLongPress: true`), long-press tooltip, and perf thresholds for 30d datasets
  src/components/ui/PriceHistoryList.tsx: Reverse-chronological rate log keyed by `id` with progressive `20`-item pagination
  src/components/ui/StatsRow.tsx: Actual / Max / Min / Variation summary card

components_onboarding:
  src/components/onboarding/OnboardingScreen.tsx: Full-bleed edge-to-edge studio gradient onboarding with brand header, `"Saltar"`, `OnboardingPager`, `OnboardingDots`, and `"Siguiente"`/`"Entrar"` CTA
  src/components/onboarding/OnboardingPager.tsx & .web.tsx: Native `PagerView` (+ web `ScrollView` fallback) streaming `scrollOffset` via Reanimated `useEvent`/`useHandler`
  src/components/onboarding/OnboardingSlides.tsx: 4 asymmetrical slides (`RealtimeRatesSlide`, `OfflineAccessSlide`, `ShoppingCalculatorSlide`, `PersonalizationHistorySlide`) using `assets/images/onboarding-1..4.webp` with basic entrance animations
  src/components/onboarding/OnboardingDots.tsx: Fluid interpolated pill indicator (`8px -> 30px`)

components_shopping:
  src/components/shopping/CurrencyChipRow.tsx: 4-currency selector pill bar (`default` | `hero`)
  src/components/shopping/ShoppingEntryCard.tsx: Main screen card to launch/resume shopping calculator or open lists
  src/components/shopping/BudgetProgressCard.tsx: `BudgetProgressBar` + `ListSettingsModal` for list title and optional budget limit
  src/components/shopping/ProductFormCard.tsx: Fast item entry/edit form (price, currency selector, `-`/`+` quantity stepper, optional name, live subtotal preview)
  src/components/shopping/ShoppingItemRow.tsx: Item row with native/converted subtotals and quantity/edit/delete controls
  src/components/shopping/ActualPaidCard.tsx: Checkout price input + calculated vs actual difference summary

config:
  app.json: Expo config (`version: 1.0.2`, `android.versionCode: 2`, `android.package: com.devlopez.ratesvenapp`, `ios.bundleIdentifier: com.devlopez.ratesvenapp`, orange splash `#ff6b26`, `extra.eas.projectId`)
  eas.json: EAS build profiles (`development`, `preview` [APK], `production` [APK], `production-aab` [AAB])
  android/: Native Android config (R8 minify + resource shrinking + compressed `.so` + `arm64-v8a,armeabi-v7a`, `expo.webp.enabled=true` for WebP onboarding assets, Android 14+ 3-button nav bar contrast fix in `MainActivity.kt`/`styles.xml`, local release signing via gitignored `android/keystore.properties` + root `.jks`)
  tailwind.config.js & src/global.css: Theme tokens + Poppins weight-to-fontFamily mapping (`--color-primary` in `.dark:root` defaults to `184 69 20`)
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
  detail: `currencyStore.ts` `partialize` persists ONLY `themeMode`, `primaryColor`, and `hasCompletedOnboarding`. Do NOT persist `selectedCurrency` or `amount`. `_layout.tsx` waits for `storeHydrated` before hiding `AnimatedSplashOverlay` or deciding between `OnboardingScreen` and `(tabs)`.

all_currencies_visible:
  rule: Converter screen MUST always render all 4 currencies (`USD`, `EUR`, `USDT`, `VES`) — 1 in `CurrencyInput` + 3 `RateCard`s below (`VES` first when not selected). Never filter out `USD`/`EUR` if a rate is `0`; show `"--"` / `"Tasa no disponible"`.

debounce_and_clear:
  typing: `inputValue` updates synchronously on `onChangeText`; `debouncedAmount` updates after `300ms` (`DEBOUNCE_MS`).
  card_tap: `handleCardPress` cancels pending debounce timer and computes via `convertAmount()` using immediate `inputValue`.
  clear_button: Visible in `CurrencyInput` whenever `value.length > 0`; tapping clears input and `debouncedAmount` to `''` for fast typing (boot default remains `'1'`).

textinput_clipping_fix:
  rule: Keep `TextInput` in `CurrencyInput.tsx` with explicit `height: 52`, `fontSize: 30`, `fontFamily: 'Poppins_700Bold'`, `paddingVertical: 0`, `textAlignVertical: 'center'`, `includeFontPadding: false`.
  why: Adding NativeWind `text-3xl` sets `lineHeight: 36`, which clips/shifts the `"0.00"` placeholder upward when empty.

number_parsing_bug_trap:
  rule: `CurrencyInput` stores standard dot-decimal strings (`"914.02"`), while `formatInputValue` adds comma thousands (`"1,000.50"`). `parseFormattedNumber()` must preserve single-`.` decimals (never strip all dots blindly like `.replace(/\./g, '')`, or `"914.02"` turns into `91402`).

dark_primary_colors:
  rule: `useThemeColors()` resolves `accent.primaryDark` / `accent.rgbDark` when `isDark` is true and bright `accent.primary` / `accent.rgb` in light mode. Keep text neutral using `text-text-primary` (not `text-primary`).

offline_and_cache:
  connectivity: Use `Boolean(state.isConnected) && state.isInternetReachable !== false` (`isInternetReachable` can initialize as `null`).
  query_mode: `QueryClient` uses `networkMode: 'offlineFirst'`, `refetchOnWindowFocus: false`, `retry: 1`. `useCurrencyRates` includes `useIsRestoring()` in `isLoading` so `EmptyState` never flashes during AsyncStorage hydration.
  fallback: `ratesApi.ts` checks `isNetworkOnline()` before fetching; if offline or on `429`/`5xx`/timeout, returns last saved `AsyncStorage` entry (`@ratesvenapp/api_cache:*`). `expireApiCache()` sets `cachedAt: 0` without deleting fallback data; `clearApiCache()` deletes cache keys while leaving Zustand theme/onboarding/shopping stores intact.

gesture_and_chart_gotchas:
  gesture_detector: Every `GestureDetector` wrapping a composite component or `View` MUST have a non-flattened `<View collapsable={false}>` direct child.
  pull_to_refresh: `PullToRefreshScrollView` requires `scrollY <= 1`, `activeOffsetY(48)`, `PULL_DEAD_ZONE = 200`, and `PULL_TRIGGER_DISTANCE = 380` to avoid accidental fetches.
  gifted_charts: `PriceChart` MUST set `pointerConfig.activatePointersOnLongPress: true` (otherwise `gifted-charts-core` forces `disableScroll = true`), set `maxValue` relative to `yAxisOffset` (`maxVal + padding - yAxisOffset`), and read tooltip values from original `data[pointerIndex].value`.
  history_intraday_keys: `YD_USD` has ~6 records/day. Keep full ISO `created_at` in `ChartDataPoint.date`, key `PriceHistoryList` items by `item.id`, and deduplicate X-axis day labels (`15 nov` once per day + `HH:mm` on `3d`/`7d` or blank on `30d`).

native_build_gotchas:
  gradle_clean: Never include `clean` in routine `build:apk:native`/`build:apk:arm64`/`build:aab:native` scripts because stale `.cxx/Debug` CMake files fail `:app:externalNativeBuildCleanDebug`. Use `pnpm android:clean` (`rm -rf android/app/.cxx android/app/build android/build && cd android && ./gradlew clean`) when a full clean is required.

fonts_and_hero_layout:
  poppins: `tailwind.config.js` resets `fontWeight` to `'normal'` and `src/global.css` maps `.font-medium`/`.font-bold`/etc. to `Poppins_*` files for Android compatibility.
  hero_safe_area: `index.tsx` uses `contentInsetAdjustmentBehavior="never"` on `PullToRefreshScrollView` so `RatesHero` sits flush behind the status bar using `useSafeAreaInsets().top`.
</invariants_and_gotchas>

<commands>
dev:
  `pnpm start` | `pnpm android` | `pnpm android:release` | `pnpm android:clean` | `pnpm ios` | `pnpm web`
validation:
  `pnpm typecheck` (`tsc --noEmit`) — run after every code edit
  note: `pnpm lint` (`expo lint`) currently prompts interactively (no ESLint config installed)
local_native_builds:
  `pnpm build:apk:native` (universal release APK: `armeabi-v7a,arm64-v8a`, `NODE_ENV=production`, R8 + resource shrink + PNG crunch + bundle & `.so` compression)
  `pnpm build:apk:arm64` (lightweight `arm64-v8a`-only release APK)
  `pnpm build:aab:native` (local release AAB for Play Store)
eas_apk_builds:
  `pnpm build:apk` (`eas build --platform android --profile preview`)
  `pnpm build:apk:local` (uses local `.env`)
  `pnpm build:apk:prod` | `pnpm build:apk:prod:local` | `pnpm build:aab`
  note: `extra.eas.projectId` is set in `app.json`; remote EAS builds require `EXPO_PUBLIC_RATES_API_KEY` pushed to EAS env (`eas env:push`) since `.env` is gitignored.
</commands>
