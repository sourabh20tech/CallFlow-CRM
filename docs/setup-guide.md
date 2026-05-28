# Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (optional for demo mode)

## Install

```bash
npm install
cp .env.example .env.local
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | For auth/DB | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth/DB | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin ops | Server-only; agent create/reset |
| `NEXT_PUBLIC_APP_URL` | Recommended | App URL for auth redirects |

Without Supabase, the app runs in **demo mode** with in-memory data under `lib/data/demo/`.

### Verify connection

After starting the dev server:

```bash
curl http://localhost:3000/api/health/supabase
```

Expect `"ok": true` when URL and anon key are valid. Import clients from `@/lib/supabase`.

## Database

1. Run migrations from `database/migrations/` in order (see `database/README.md`).
2. Assign roles on `profiles` for admin/agent users.
3. Optional: `npm run db:types` to regenerate TypeScript types.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js routes and API |
| `components/` | UI, layouts, feature modules |
| `services/` | Business logic and DB layer |
| `lib/` | Auth, Supabase clients, utilities |
| `database/` | SQL migrations and DB docs |
| `types/` | Shared TypeScript types |
| `constants/` | App metadata and navigation |
| `hooks/`, `store/`, `contexts/` | Client state |
