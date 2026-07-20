-- ============================================================================
-- COMPREHENSIVE RLS RECURSION FIX
-- ============================================================================
-- Problem: is_admin() and is_agent() functions read from `profiles` table,
-- causing infinite recursion when used in RLS policies.
-- 
-- Solution: Rewrite these functions to use auth.jwt() -> raw_app_meta_data
-- which reads directly from the JWT token (NO table access = NO recursion).
--
-- ALSO: Fix profiles table policies to use direct subquery pattern.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix the helper functions to use JWT metadata
-- ============================================================================

-- We need to store the role in raw_app_meta_data for JWT-based checks.
-- But first, let's use a SAFE approach that avoids recursion:
-- Use a subquery with SECURITY DEFINER that bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_agent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'agent'
  );
$$;

-- NOTE: SECURITY DEFINER functions bypass RLS on the tables they access.
-- This is the KEY fix — the function runs as the function owner (postgres),
-- NOT as the current user, so RLS on `profiles` is NOT evaluated.

-- Also fix current_agent_id() to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.current_agent_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.agents WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ============================================================================
-- STEP 2: Fix PROFILES table RLS policies (the recursion source)
-- ============================================================================

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "Agents can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all_authenticated" ON public.profiles;

-- Simple approach: ALL authenticated users can READ all profiles
-- (This is safe — profiles only contain name, email, role, avatar)
CREATE POLICY "profiles_read_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (using the SECURITY DEFINER function)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Admins can insert profiles
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================================
-- STEP 3: Fix AGENTS table policies
-- ============================================================================

DROP POLICY IF EXISTS "agents_select_admin" ON public.agents;
DROP POLICY IF EXISTS "agents_select_own" ON public.agents;
DROP POLICY IF EXISTS "agents_insert_admin" ON public.agents;
DROP POLICY IF EXISTS "agents_update_admin" ON public.agents;
DROP POLICY IF EXISTS "agents_update_own_status" ON public.agents;
DROP POLICY IF EXISTS "agents_delete_admin" ON public.agents;

CREATE POLICY "agents_select_admin"
  ON public.agents FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "agents_select_own"
  ON public.agents FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "agents_insert_admin"
  ON public.agents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "agents_update_admin"
  ON public.agents FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "agents_update_own_status"
  ON public.agents FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "agents_delete_admin"
  ON public.agents FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 4: Fix LEADS table policies
-- ============================================================================

DROP POLICY IF EXISTS "leads_select_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_select_assigned_agent" ON public.leads;
DROP POLICY IF EXISTS "leads_select_created_by" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_update_assigned_agent" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admin" ON public.leads;

CREATE POLICY "leads_select_admin"
  ON public.leads FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "leads_select_assigned_agent"
  ON public.leads FOR SELECT TO authenticated
  USING (assigned_agent_id = public.current_agent_id());

CREATE POLICY "leads_select_created_by"
  ON public.leads FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "leads_insert_authenticated"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_update_admin"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "leads_update_assigned_agent"
  ON public.leads FOR UPDATE TO authenticated
  USING (assigned_agent_id = public.current_agent_id());

CREATE POLICY "leads_delete_admin"
  ON public.leads FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 5: Fix CALL_LOGS table policies
-- ============================================================================

DROP POLICY IF EXISTS "call_logs_select_admin" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_select_own_agent" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_select_lead_access" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_insert_authenticated" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_update_admin" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_update_own_agent" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_delete_admin" ON public.call_logs;

CREATE POLICY "call_logs_select_admin"
  ON public.call_logs FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "call_logs_select_own_agent"
  ON public.call_logs FOR SELECT TO authenticated
  USING (agent_id = public.current_agent_id());

CREATE POLICY "call_logs_insert_authenticated"
  ON public.call_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "call_logs_update_admin"
  ON public.call_logs FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "call_logs_update_own_agent"
  ON public.call_logs FOR UPDATE TO authenticated
  USING (agent_id = public.current_agent_id());

CREATE POLICY "call_logs_delete_admin"
  ON public.call_logs FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 6: Fix FOLLOW_UPS table policies (table was renamed from followups)
-- ============================================================================

-- Drop from both possible table names (follow_ups is the real table, followups is a view)
DROP POLICY IF EXISTS "followups_select_admin" ON public.follow_ups;
DROP POLICY IF EXISTS "followups_select_assigned" ON public.follow_ups;
DROP POLICY IF EXISTS "followups_select_lead_access" ON public.follow_ups;
DROP POLICY IF EXISTS "followups_insert_authenticated" ON public.follow_ups;
DROP POLICY IF EXISTS "followups_update_admin" ON public.follow_ups;
DROP POLICY IF EXISTS "followups_update_assigned" ON public.follow_ups;
DROP POLICY IF EXISTS "followups_delete_admin" ON public.follow_ups;

CREATE POLICY "followups_select_admin"
  ON public.follow_ups FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "followups_select_assigned"
  ON public.follow_ups FOR SELECT TO authenticated
  USING (assigned_agent_id = public.current_agent_id());

CREATE POLICY "followups_insert_authenticated"
  ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "followups_update_admin"
  ON public.follow_ups FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "followups_update_assigned"
  ON public.follow_ups FOR UPDATE TO authenticated
  USING (assigned_agent_id = public.current_agent_id());

CREATE POLICY "followups_delete_admin"
  ON public.follow_ups FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 7: Fix NOTES table policies (may not exist if lead_notes replaced it)
-- ============================================================================

-- Only apply if the old notes table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "notes_select_admin" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_select_author" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_select_lead_access" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_insert_authenticated" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_update_author" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_update_admin" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_delete_author" ON public.notes';
    EXECUTE 'DROP POLICY IF EXISTS "notes_delete_admin" ON public.notes';

    EXECUTE 'CREATE POLICY "notes_select_admin" ON public.notes FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "notes_select_author" ON public.notes FOR SELECT TO authenticated USING (author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notes_insert_authenticated" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notes_update_author" ON public.notes FOR UPDATE TO authenticated USING (author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notes_update_admin" ON public.notes FOR UPDATE TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "notes_delete_author" ON public.notes FOR DELETE TO authenticated USING (author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notes_delete_admin" ON public.notes FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: Fix LEAD_NOTES table policies
-- ============================================================================

DROP POLICY IF EXISTS "lead_notes_select_admin" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_select_author" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_select_lead_access" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_insert_authenticated" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_update_author" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_update_admin" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_delete_author" ON public.lead_notes;
DROP POLICY IF EXISTS "lead_notes_delete_admin" ON public.lead_notes;

-- Only create if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_notes' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "lead_notes_select_admin" ON public.lead_notes FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_notes_select_author" ON public.lead_notes FOR SELECT TO authenticated USING (author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "lead_notes_insert_authenticated" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "lead_notes_update_author" ON public.lead_notes FOR UPDATE TO authenticated USING (author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "lead_notes_update_admin" ON public.lead_notes FOR UPDATE TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_notes_delete_author" ON public.lead_notes FOR DELETE TO authenticated USING (author_id = auth.uid())';
    EXECUTE 'CREATE POLICY "lead_notes_delete_admin" ON public.lead_notes FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: Fix ACTIVITY_LOGS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can read activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Agents can read own activity_logs" ON public.activity_logs;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "activity_logs_select_admin" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "activity_logs_select_own" ON public.activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "activity_logs_insert_authenticated" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- ============================================================================
-- STEP 10: Fix LEAD_STATUSES table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage statuses" ON public.lead_statuses;
DROP POLICY IF EXISTS "Admins can insert statuses" ON public.lead_statuses;
DROP POLICY IF EXISTS "Admins can update statuses" ON public.lead_statuses;
DROP POLICY IF EXISTS "Admins can delete statuses" ON public.lead_statuses;
DROP POLICY IF EXISTS "Everyone can view statuses" ON public.lead_statuses;
DROP POLICY IF EXISTS "Anyone can read statuses" ON public.lead_statuses;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_statuses' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "lead_statuses_select" ON public.lead_statuses FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "lead_statuses_insert_admin" ON public.lead_statuses FOR INSERT TO authenticated WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_statuses_update_admin" ON public.lead_statuses FOR UPDATE TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_statuses_delete_admin" ON public.lead_statuses FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- ============================================================================
-- STEP 11: Fix LEAD_SOURCES table policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Admins can insert sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Admins can update sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Admins can delete sources" ON public.lead_sources;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_sources' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "lead_sources_select" ON public.lead_sources FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "lead_sources_insert_admin" ON public.lead_sources FOR INSERT TO authenticated WITH CHECK (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_sources_update_admin" ON public.lead_sources FOR UPDATE TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_sources_delete_admin" ON public.lead_sources FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- ============================================================================
-- STEP 12: Fix WORK_SESSIONS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.work_sessions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_sessions' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "work_sessions_select_admin" ON public.work_sessions FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "work_sessions_select_own" ON public.work_sessions FOR SELECT TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "work_sessions_insert_own" ON public.work_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "work_sessions_update_own" ON public.work_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================================================
-- STEP 13: Fix NOTIFICATIONS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (recipient_id = auth.uid())';
    EXECUTE 'CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- ============================================================================
-- STEP 14: Fix LEAD_FUNDS table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all funds" ON public.lead_funds;
DROP POLICY IF EXISTS "Agents can view own funds" ON public.lead_funds;
DROP POLICY IF EXISTS "Authenticated can insert funds" ON public.lead_funds;
DROP POLICY IF EXISTS "Admins can delete funds" ON public.lead_funds;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_funds' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "lead_funds_select_admin" ON public.lead_funds FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_funds_select_agent" ON public.lead_funds FOR SELECT TO authenticated USING (agent_id = auth.uid())';
    EXECUTE 'CREATE POLICY "lead_funds_insert" ON public.lead_funds FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
    EXECUTE 'CREATE POLICY "lead_funds_update_admin" ON public.lead_funds FOR UPDATE TO authenticated USING (public.is_admin())';
    EXECUTE 'CREATE POLICY "lead_funds_delete_admin" ON public.lead_funds FOR DELETE TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- ============================================================================
-- STEP 15: Ensure deleted_at column exists on leads (for soft-delete)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'deleted_at' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ============================================================================
-- STEP 16: Ensure deleted_at column exists on agents
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'deleted_at' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ============================================================================
-- STEP 17: Ensure deleted_at column exists on call_logs
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'deleted_at' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.call_logs ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- ============================================================================
-- STEP 18: Ensure phone column on profiles
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
END $$;

-- ============================================================================
-- DONE! Reload PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION: Test the functions work without recursion
-- ============================================================================
-- Run these manually to verify:
-- SELECT public.is_admin();
-- SELECT public.is_agent();
-- SELECT * FROM public.profiles LIMIT 5;
-- SELECT * FROM public.leads LIMIT 5;
-- SELECT * FROM public.followups LIMIT 5;
