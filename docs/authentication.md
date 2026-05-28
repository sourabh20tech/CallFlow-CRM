# Authentication

Call Center CRM uses **Supabase Auth** with role-based access (`admin` | `agent`).

## Architecture

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Edge | `proxy.ts` → `lib/supabase/middleware.ts` | Session refresh, redirects, role headers |
| Server | `lib/auth/session.ts`, `lib/auth/guards.ts` | RSC / API user resolution |
| Client | `contexts/auth-context.tsx` | Session state, sign in/out |
| UI | `components/auth/*` | Login, guards, logout |

## Roles

- **admin** — Full CRM, settings, agents, reports
- **agent** — Workspace, calls, follow-ups (blocked when CRM maintenance is on)

Profiles are stored in `public.profiles` (see `database/migrations/001_profiles.sql`).

Run `005_profiles_ensure_rpc.sql` to backfill existing Auth users and enable `ensure_current_user_profile()` RPC (auto-creates profiles on login without service role).

## Usage

```tsx
// Client
import { useAuth, useRole, useSession } from "@/hooks";
import { ProtectedRoute, LogoutButton } from "@/components/auth";

// Server page
import { requireAdmin, requireAuth } from "@/lib/auth";
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL (no `/rest/v1/` suffix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon / publishable key |
| `NEXT_PUBLIC_APP_URL` | Recommended | Password reset redirects (`http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Auto-creates missing `profiles` rows for users added in the Auth dashboard |

Without the service role key, sign-in still works if `public.profiles` exists (trigger on signup) or `user_metadata.role` is set.

## Login validation

Zod schema: `lib/auth/schemas.ts` (`loginSchema`).

After password sign-in, the app calls `POST /api/auth/sync-profile` to upsert a profile when needed, then validates the **Admin / Agent** portal tab matches `profiles.role`.

The browser uses a **singleton** Supabase client (`lib/supabase/client.ts`) so session cookies persist correctly. Middleware only redirects authenticated users away from `/login` when a CRM role is resolved (prevents redirect loops when a profile is missing).

## Protected routes

- **Middleware**: unauthenticated users → `/login?redirectTo=...`
- **Dashboard layout**: `AuthGuard` + `CrmAccessGuard`
- **Admin sections**: `ProtectedRoute roles="admin"` on agents/settings layouts

## Logout

`UserMenu` or `LogoutButton` calls `signOut()` → clears Supabase session → `/login`.
