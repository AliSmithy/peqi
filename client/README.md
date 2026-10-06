# PEQI Client (Prototype)

Quasar/Vue 3 prototype for **پایش کیفیت آزما پارت (PEQI)** type-approval workflow demo.

## Quick start

```bash
cd client
npm install
npm run dev
```

Open http://localhost:9000

## Demo login

| Username   | Password | Access                          |
|-----------|----------|----------------------------------|
| `admin`   | `peqi`   | Cartable + admin (users/roles/backups) |
| `inspector` | `peqi` | Cartable + workflow              |
| `manager` | `peqi`   | Cartable + new request + workflow |

## Mock API

This prototype runs **without a backend**. All `/api/*` calls are intercepted in `src/mocks/` when `useMocks` is enabled (default in `quasar.config.js`).

To disable mocks (for a future real API), set `useMocks: false` in `quasar.config.js` → `build.env`.

## Workflow demo

1. Log in as `admin` / `peqi`
2. Open **کارپوشه** (Cartable)
3. Double-click a sample case (e.g. `TA-1404-003` at physical inspection step)
4. Walk through the 14-step **تأیید نوع** flow using save/forward actions

The cartable is seeded with 12 demo cases (`PEQI-1404-1001` … `1012`) at various workflow stages.

## Structure

- `src/pages/flow/typeapproval/ring-1..14.vue` — workflow forms
- `src/mocks/` — in-memory fake API
- `src/assets/logo-peqi.png` — PEQI branding
