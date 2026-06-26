import { AgentEmailExistsError } from "@/lib/agents/errors";
import { createAdminSupabaseClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { agentsDbServiceServer } from "@/services/db/agents.service";
import type { Agent, CreateAgentInput } from "@/types/agent";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAuthDuplicateError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("duplicate") ||
    lower.includes("user already")
  );
}

function formatAuthCreateError(message: string): string {
  if (message.toLowerCase().includes("database error creating new user")) {
    return (
      "Supabase could not create the auth user (database trigger failure). " +
      "In Supabase → Logs → Postgres, check errors from public.handle_new_user(), " +
      "then re-run the handle_new_user / on_auth_user_created SQL from database/migrations/000_enterprise_production_setup.sql."
    );
  }
  return message;
}

export class AgentsAdminService {
  async createAgent(input: CreateAgentInput): Promise<Agent> {
    if (!isAdminClientConfigured()) {
      throw new Error(
        "Admin API requires SUPABASE_SERVICE_ROLE_KEY in .env.local to create agents.",
      );
    }

    const admin = createAdminSupabaseClient();
    const email = normalizeEmail(input.email);
    const isActive = input.isActive ?? true;
    const department = input.department ?? "General";

    // Check email uniqueness — only among ACTIVE agents (not deleted ones)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, agents!inner(id, deleted_at)")
      .eq("email", email)
      .is("agents.deleted_at", null)
      .maybeSingle();

    if (existingProfile) {
      throw new AgentEmailExistsError();
    }

    let userId: string | null = null;

    try {
      // Try creating a new auth user
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName,
          phone: input.phone,
          role: "agent",
        },
      });

      if (authError || !authData.user) {
        if (authError && isAuthDuplicateError(authError.message)) {
          // Auth user exists — might be a previously deleted agent.
          // Try to find and reactivate them.
          const { data: listData } = await admin.auth.admin.listUsers();
          const existingUser = listData?.users?.find(
            (u) => u.email?.toLowerCase() === email,
          );

          if (existingUser && existingUser.banned_until) {
            // This is a disabled/deleted agent — reactivate with new password
            await admin.auth.admin.updateUserById(existingUser.id, {
              password: input.password,
              ban_duration: "none",
              user_metadata: {
                full_name: input.fullName,
                phone: input.phone,
                role: "agent",
              },
            });
            userId = existingUser.id;
          } else {
            throw new AgentEmailExistsError();
          }
        } else {
          throw new Error(
            formatAuthCreateError(authError?.message ?? "Failed to create auth user"),
          );
        }
      } else {
        userId = authData.user.id;
      }

      const { error: profileError } = await admin.from("profiles").upsert(
        {
          id: userId,
          full_name: input.fullName,
          email,
          phone: input.phone,
          role: "agent",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw new Error(profileError.message);
      }

      const { data: agentRow } = await admin
        .from("agents")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (!agentRow) {
        const { error: insertError } = await admin.from("agents").insert({
          profile_id: userId,
          department,
          status: input.status ?? "offline",
          is_active: isActive,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      } else {
        const { error: updateError } = await admin
          .from("agents")
          .update({
            department,
            status: input.status ?? "offline",
            is_active: isActive,
          })
          .eq("id", agentRow.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      if (!isActive) {
        await this.setAgentAuthEnabled(userId, false);
      }

      const agent = await agentsDbServiceServer.getByProfileId(userId, admin);
      if (!agent) {
        throw new Error("Agent record was not created");
      }

      return agent;
    } catch (error) {
      if (userId) {
        await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      }
      throw error;
    }
  }

  /** Enables or disables Supabase Auth sign-in (ban / unban). */
  async setAgentAuthEnabled(profileId: string, enabled: boolean): Promise<void> {
    if (!isAdminClientConfigured()) {
      return;
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.auth.admin.updateUserById(profileId, {
      ban_duration: enabled ? "none" : "876000h",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateAgentAuthEmail(profileId: string, email: string): Promise<void> {
    if (!isAdminClientConfigured()) {
      return;
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.auth.admin.updateUserById(profileId, {
      email: normalizeEmail(email),
    });

    if (error) {
      if (isAuthDuplicateError(error.message)) {
        throw new AgentEmailExistsError();
      }
      throw new Error(error.message);
    }
  }

  async resetPassword(profileId: string, password: string): Promise<void> {
    if (!isAdminClientConfigured()) {
      throw new Error(
        "Admin API requires SUPABASE_SERVICE_ROLE_KEY to reset passwords.",
      );
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.auth.admin.updateUserById(profileId, { password });

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteAgentAuth(profileId: string): Promise<void> {
    if (!isAdminClientConfigured()) {
      return;
    }

    const admin = createAdminSupabaseClient();
    await admin.auth.admin.deleteUser(profileId);
  }
}

export const agentsAdminService = new AgentsAdminService();
