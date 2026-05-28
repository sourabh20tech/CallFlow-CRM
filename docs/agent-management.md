# Agent authentication management

Admins create and manage agent accounts from **Dashboard → Agents**. Each agent gets a Supabase Auth user, a `profiles` row (`role: agent`), and an `agents` row for CRM data.

## Requirements covered

| Capability | Implementation |
|------------|----------------|
| Admin creates agents in CRM | `AgentsManagement` → `POST /api/agents` |
| Supabase Auth user | `AgentsAdminService.createAgent` → `auth.admin.createUser` |
| Database storage | `profiles` + `agents` tables |
| Multiple agents | Unbounded roster; list/filter in UI |
| Email + password login | Agent portal on `/login` (`role: agent`) |
| Role-based security | `requireAgentsAdminApi`, `ProtectedRoute`, middleware |
| Active / inactive | `agents.is_active` + Auth ban sync |

## Admin workflow

1. Open **Agents** (admin only).
2. Click **Add agent** — provide name, email, password, department, optional presence status, and **Active account**.
3. The server creates:
   - Auth user (email confirmed)
   - Profile with `role: agent`
   - Agent row with department, status, `is_active`
4. Share credentials with the agent; they sign in on the **Agent** tab at `/login`.

## Deactivate / reactivate

- Toggle from the agent table or edit modal.
- Sets `agents.is_active` and bans/unbans the Auth user (`ban_duration`).
- Inactive agents are signed out at login and blocked by middleware.

## Environment

```env
SUPABASE_SERVICE_ROLE_KEY=...   # Required for create, ban, password reset, email sync
```

## API (admin only)

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/agents` | List agents |
| `POST` | `/api/agents` | Create agent |
| `PATCH` | `/api/agents/[id]` | Update agent / active status |
| `DELETE` | `/api/agents/[id]` | Delete agent + auth user |
| `POST` | `/api/agents/[id]/reset-password` | Set new password |

## Self-registration

Public agent signup is disabled when Supabase is configured. Only admins provision accounts.

## Promote to admin

```sql
update public.profiles set role = 'admin' where email = 'admin@company.com';
```

Admin users sign in on the **Administrator** portal tab.
