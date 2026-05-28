# CallFlow CRM

Production-ready Call Center CRM built with **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS v4**, and **Supabase** (Auth, PostgreSQL, RLS).

**VRSH GOUD SERVICES** — secure access for admin and agent operations teams.

## Features

- Admin and agent dashboards with role-based access control
- Leads, calls, follow-ups, agents, reports (Excel + PDF export)
- Supabase-backed data layer (no demo/mock runtime fallback)
- Real-time system status, admin announcements, data management (soft delete / trash)
- WhatsApp quick-chat links (no paid API)
- Glassmorphism UI with light / dark / midnight themes

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase project values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon / publishable key (client-safe) |
| `NEXT_PUBLIC_APP_URL` | Yes | e.g. `http://localhost:3000` or production URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (admin APIs) | **Server-only** — never expose to the browser |

Run SQL migrations from `database/migrations/` in order (see [database/README.md](database/README.md)). Mirror copies live in `supabase/migrations/` for Supabase CLI.

## Project structure

```
app/                    # Next.js App Router (pages + API routes)
components/             # UI, layouts, feature modules
services/               # Domain services
  db/                   # Supabase data access
lib/                    # Auth, API guards, Supabase clients, reports
database/migrations/    # SQL migrations (source of truth)
supabase/migrations/    # Supabase CLI mirror
types/                  # Shared TypeScript types
hooks/                  # React hooks
contexts/               # Providers (auth, system status)
constants/              # App metadata, navigation
docs/                   # Setup, auth, deployment guides
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:types` | Regenerate Supabase types (see package.json) |

## Deployment (Vercel)

1. Push this repository to GitHub (secrets stay local — `.env.local` is gitignored).
2. Import the repo in [Vercel](https://vercel.com).
3. Add environment variables from `.env.example` in the Vercel project settings.
4. Deploy; set `NEXT_PUBLIC_APP_URL` to your production domain.

See [docs/deployment-guide.md](docs/deployment-guide.md) for full production checklist.

## Security

- **Never commit** `.env.local` or service role keys.
- Use `.env.example` as the template only.
- Rotate Supabase keys if they were ever exposed in git history.

## Documentation

- [Setup guide](docs/setup-guide.md)
- [Authentication](docs/authentication.md)
- [Deployment](docs/deployment-guide.md)
- [Agent management](docs/agent-management.md)

## License

Private — all rights reserved. Copyright © 2026 CallFlow CRM.
