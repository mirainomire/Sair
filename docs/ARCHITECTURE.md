# Architecture and contribution guide

## System boundary

The project is split into two independently runnable applications:

```text
Browser
  -> Nuxt web app (port 3000)
       -> REST API client and Pinia state
            -> NestJS API (port 3001, global prefix /api)
                 -> in-memory pilot data loaded from nest/data/*.json
```

The frontend is responsible for presentation, navigation, browser preferences, and request orchestration. The API is responsible for authentication, validation, business rules, and response shaping. The JSON files are sample data, not a database.

## Repository layout

### Frontend: `nuxt/`

- `pages/` — route-level screens. A page owns its template and screen-specific UI state.
- `components/` — reusable visual components with no page-specific data fetching.
- `composables/` — reusable client behavior and API orchestration (`useApi`, authentication, appearance, async-data error handling).
- `stores/` — cross-route state. Currently the pilot profile is cached here to avoid repeated profile requests.
- `types/` — shared frontend API shapes.
- `utils/` — pure formatting and error helpers.
- `assets/scss/main.scss` — current global visual system and responsive rules.

### Backend: `nest/src/`

- `*.module.ts` — feature boundaries and dependency registration.
- `*.controller.ts` — HTTP routes, DTO binding, and OpenAPI metadata. Keep business logic out of controllers.
- `*.service.ts` — business rules and response mapping.
- `data/` — sample-data access. `PilotDataService` loads files once at startup.
- `common/` — cross-feature date, error, and API documentation helpers.

## Request flow

1. A page calls `useAuthedAsyncData` with a stable key.
2. `useApi` resolves the server/client API base and adds the cookie token as a Bearer header.
3. The Nest global auth guard verifies protected requests.
4. A feature controller delegates to its service.
5. The service reads the in-memory data service, applies domain rules, and returns the API envelope.
6. The page maps the response into display state.

Independent requests should use `Promise.all`. Cross-route data that is already available should use Pinia instead of fetching the same profile again.

## Layering rules

When adding a feature, keep responsibilities in this order:

1. **Data/API layer** — DTOs, API response types, service rules, and validation.
2. **State/orchestration layer** — composables and Pinia stores for reusable fetching, caching, and persistence.
3. **Presentation layer** — pages and components for markup, accessibility, and local display state.
4. **Style layer** — shared tokens and component styles in SCSS.

Do not put API calls in reusable visual components. Do not duplicate authentication headers in pages. Do not make a controller calculate display-only labels when the frontend can format them from a typed response.

## Current intentional trade-offs

- The larger pages (`index.vue`, `schedule/index.vue`, and `logbook.vue`) still contain screen-specific computed values and formatting. This keeps the small sample app easy to navigate, but repeated domain transformations should move into feature composables if the app grows.
- `main.scss` is a single legacy stylesheet. New styles should be grouped by feature and use the existing CSS variables; a future cleanup can split it into token, layout, component, and page partials.
- Sample data is loaded at API startup. Changing a JSON file requires restarting the API process.
- The schedule detail route is currently a placeholder.

## UI preferences

`useAppearance` owns light/dark mode and text-size preferences. `useLanguage` owns the selected document language, while `useNotifications` owns notification preferences. Authentication/session preference is handled by the login cookie. These composables persist browser preferences in `localStorage`; production push notifications and WebAuthn require server-backed credentials and delivery infrastructure.

## Verification checklist

Before handing off a change:

- Run `npm run build:api` from the repository root.
- Run `npm run build:web` from the repository root.
- Check login, Home, Schedule (Today/Weekly/Monthly), Logbook monthly grouping/infinite scroll, Documents, Profile, Privacy, and Crew operations contacts.
- Check both light and dark mode, plus small and large text settings.
- Run `git diff --check` and confirm generated `.nuxt/` and `dist/` files are not committed.
