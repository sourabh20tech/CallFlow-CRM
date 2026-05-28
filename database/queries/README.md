# Database queries

All production queries are implemented in `services/db/` using the Supabase typed client.

Do not add raw SQL here unless you introduce a dedicated query layer (e.g. RPC functions documented alongside migration files).
