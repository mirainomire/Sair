# Susi Air pilot app

Mobile web app for a Susi Air pilot: sign in, see hours against duty limits, documents, and the monthly schedule.

Two apps, hosted separately:

- `nuxt` is the Nuxt 3 frontend (Composition API, `<script setup>`, Pinia, SCSS).
- `nest` is the NestJS API. At startup it reads the three JSON files into memory. No database.

Architecture, layer boundaries, request flow, and contribution guidance are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Sample sign-in: `johndoe` / `susiairtest`.

The profile `totalFlightHours` value is an overall total only. It is not a PIC, SIC, dual, or instruction breakdown; those categories are not present in the sample data.

Operational today is **15 May 2026**. The API does not call `new Date()` to decide what day it is. Set `SAMPLE_TODAY` to another real `YYYY-MM-DD` if a review needs a different day. `Date` is used only to format or shift a date string the API already returned. The greeting uses the viewer's clock for morning, afternoon, or evening. It does not move the schedule or the hour limits.

## Run locally

Node.js 22.

```powershell
npm install --prefix nest
npm install --prefix nuxt
Copy-Item nest\.env.example nest\.env
Copy-Item nuxt\.env.example nuxt\.env
```

Two terminals, from the repo root:

```powershell
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:3001/api

On a phone on the same network, set `NUXT_PUBLIC_API_BASE` to the computer's LAN address, for example `http://192.168.1.20:3001/api`. Leave `NUXT_API_BASE_SERVER` on `http://localhost:3001/api`.

## Environment variables

API (`nest`):

| Name | Required | Purpose |
| --- | --- | --- |
| `PORT` | no | Listen port. Default `3001`. |
| `CORS_ORIGIN` | yes in production | Allowed web origin. `*` is only for local development. |
| `AUTH_SECRET` | yes in production | HMAC secret for the login token. A dev fallback is used when it is unset. |
| `SAMPLE_TODAY` | no | Operational today, `YYYY-MM-DD`. Default `2026-05-15`. |

Web (`nuxt`):

| Name | Required | Purpose |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE` | yes | API base used by the browser, including `/api`. |
| `NUXT_API_BASE_SERVER` | yes | API base used by Nuxt during server render. |

## API

Global prefix `/api`. Every route except `POST /auth/login` requires `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Username and password. Returns a token. |
| GET | `/pilot/me` | Verified profile: name, crew ID, ratings, contact details, overall total hours, and avatar. |
| GET | `/flights-hours?from=&to=` | Daily hours. Missing days are `0`. |
| GET | `/flights-hours/summary?range=1w\|1m\|3m\|6m\|1y` | Limit cards and the rolling-sum chart. |
| GET | `/documents` | Documents and expiry state. |
| GET | `/schedules?year=&month=` | One month of duties. |

Errors use one shape: `{ "statusCode", "error", "message" }`.

## Choices

`PilotDataService` reads `nest/data/mock-flight-hours.json`, `mock-documents.json`, and `mock-schedules.json` once at startup and keeps them in memory. The screens do not need a database, and the brief does not require one.

The rolling sum walks every date in the window. A logged `0` and a date with no row both add `0`, so missing days are not skipped and the window does not shrink. Days before 27 Dec 2024 are missing, so they add `0` as well.

A chart point after 15 May 2026 still returns a trailing sum through that date. Hours that are already in the file count. A future date with no row adds `0`. The service does not invent hours past the file.

The chart's Y ceiling starts at the configured maximum for the toggle (45, 125, 325, 625, or 1200). If a rolling sum is higher, the ceiling grows to that sum so the line stays inside the card. The red line stays on the regulatory limit.

The login token is an HMAC of the username and expiry. One account is enough for this brief. Profile and operational contact values are seeded demo values and must be replaced with verified operator data before production.

The Profile screen stores appearance, language, notification, and session preferences on the device. Browser biometric unlock is exposed only when WebAuthn is supported; a production deployment should add a server-backed passkey registration and assertion flow.

## Deploy

The two apps are deployed separately and the frontend calls the public API.

- Frontend: https://sair-web-zeta.vercel.app
- API and OpenAPI docs: https://sair-api-eight.vercel.app/api/docs
- Repository: https://github.com/mirainomire/Sair

Sample sign-in is `johndoe` / `susiairtest`. Operational today stays 15 May 2026. The schedule detail screen is still the placeholder. Flight hours, documents, and the schedule are loaded from the JSON files at API startup. There is no database.

## With more time

Replace the single hardcoded account with a user store, persist password changes, and implement server-backed WebAuthn/passkeys and push notifications. Finish the schedule detail screen, which is a placeholder. Lock `CORS_ORIGIN` to the real web origin instead of `*`, and replace demo profile/contact values with operator-managed data.
