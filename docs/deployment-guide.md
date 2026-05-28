# Deployment Guide

This project is configured for **Supabase-backed production runtime** (no demo/mock runtime mode).

## Build

```bash
npm run build
npm run start
```

Verify locally before deploying.

## Vercel (recommended)

1. Import the repository.
2. Set environment variables from `.env.example`.
3. Set **Root Directory** to repository root.
4. Framework preset: **Next.js**.

### Required env on Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (production URL)
- `SUPABASE_SERVICE_ROLE_KEY` (if using admin agent APIs)

## Supabase production

1. Apply canonical migrations from `database/migrations/` in lexical order.
2. Enable RLS policies (included in migrations).
3. Configure Auth redirect URLs to match `NEXT_PUBLIC_APP_URL`.
4. Optional: enable Realtime replication for `leads`, `call_logs`, `follow_ups`, and `lead_notes`.

## Health checks

- `/login` loads
- `/dashboard` requires authenticated user session
- `/api/system/status` returns CRM status JSON

## Security checklist

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Confirm RLS policies before go-live.
- Restrict admin routes (`/dashboard/agents`, `/dashboard/settings`) to admin role.
