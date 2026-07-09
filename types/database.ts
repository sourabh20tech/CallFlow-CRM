/**
 * Supabase database types — keep in sync with supabase/migrations.
 * Regenerate locally: npx supabase gen types typescript --project-id <id> > types/database.generated.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "agent";
export type LeadForce = "standard" | "premium";
/** @deprecated Use LeadForce instead */
export type LeadTier = LeadForce;
export type LeadStatus =
  | "new"
  | "interested"
  | "follow_up"
  | "converted"
  | "not_interested"
  | "closed"
  | (string & {});
export type AgentStatus = "available" | "busy" | "away" | "offline";
export type CallDirection = "inbound" | "outbound";
export type CallStatus =
  | "connected"
  | "busy"
  | "no_answer"
  | "callback"
  | "interested"
  | "not_interested";
export type FollowupStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type FollowupPriority = "low" | "medium" | "high";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          profile_id: string;
          department: string;
          status: AgentStatus;
          calls_handled: number;
          avg_handle_time_seconds: number;
          satisfaction_score: number | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          department?: string;
          status?: AgentStatus;
          calls_handled?: number;
          avg_handle_time_seconds?: number;
          satisfaction_score?: number | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          department?: string;
          status?: AgentStatus;
          calls_handled?: number;
          avg_handle_time_seconds?: number;
          satisfaction_score?: number | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          tier: LeadTier;
          status: LeadStatus;
          source: string | null;
          assigned_agent_id: string | null;
          created_by: string | null;
          converted_at: string | null;
          last_contacted_at: string | null;
          next_follow_up_at: string | null;
          metadata: Json;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          tier?: LeadTier;
          status?: LeadStatus;
          source?: string | null;
          assigned_agent_id?: string | null;
          created_by?: string | null;
          converted_at?: string | null;
          last_contacted_at?: string | null;
          next_follow_up_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          tier?: LeadTier;
          status?: LeadStatus;
          source?: string | null;
          assigned_agent_id?: string | null;
          created_by?: string | null;
          converted_at?: string | null;
          last_contacted_at?: string | null;
          next_follow_up_at?: string | null;
          metadata?: Json;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      call_logs: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string | null;
          direction: CallDirection;
          status: CallStatus;
          duration_seconds: number;
          started_at: string;
          ended_at: string | null;
          summary: string | null;
          recording_url: string | null;
          external_call_id: string | null;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id?: string | null;
          direction?: CallDirection;
          status?: CallStatus;
          duration_seconds?: number;
          started_at?: string;
          ended_at?: string | null;
          summary?: string | null;
          recording_url?: string | null;
          external_call_id?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          agent_id?: string | null;
          direction?: CallDirection;
          status?: CallStatus;
          duration_seconds?: number;
          started_at?: string;
          ended_at?: string | null;
          summary?: string | null;
          recording_url?: string | null;
          external_call_id?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_logs_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          assigned_agent_id: string | null;
          title: string;
          description: string | null;
          due_at: string;
          status: FollowupStatus;
          priority: FollowupPriority;
          completed_at: string | null;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          assigned_agent_id?: string | null;
          title: string;
          description?: string | null;
          due_at: string;
          status?: FollowupStatus;
          priority?: FollowupPriority;
          completed_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          assigned_agent_id?: string | null;
          title?: string;
          description?: string | null;
          due_at?: string;
          status?: FollowupStatus;
          priority?: FollowupPriority;
          completed_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string | null;
          crm_enabled: boolean;
          maintenance_mode: boolean;
          maintenance_title: string;
          maintenance_message: string;
          admin_announcement_title: string | null;
          admin_announcement_message: string | null;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          setting_key?: string | null;
          crm_enabled?: boolean;
          maintenance_mode?: boolean;
          maintenance_title?: string;
          maintenance_message?: string;
          admin_announcement_title?: string | null;
          admin_announcement_message?: string | null;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          setting_key?: string | null;
          crm_enabled?: boolean;
          maintenance_mode?: boolean;
          maintenance_title?: string;
          maintenance_message?: string;
          admin_announcement_title?: string | null;
          admin_announcement_message?: string | null;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey";
            columns: ["updated_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_stats: {
        Row: {
          id: string;
          stat_date: string;
          scope: string;
          agent_id: string | null;
          total_leads: number;
          converted_leads: number;
          pending_followups: number;
          total_calls: number;
          active_agents: number;
          conversion_rate: number;
          metrics: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stat_date?: string;
          scope?: string;
          agent_id?: string | null;
          total_leads?: number;
          converted_leads?: number;
          pending_followups?: number;
          total_calls?: number;
          active_agents?: number;
          conversion_rate?: number;
          metrics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stat_date?: string;
          scope?: string;
          agent_id?: string | null;
          total_leads?: number;
          converted_leads?: number;
          pending_followups?: number;
          total_calls?: number;
          active_agents?: number;
          conversion_rate?: number;
          metrics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          report_type: string;
          report_date: string;
          scope: string;
          agent_id: string | null;
          title: string;
          payload: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_type: string;
          report_date?: string;
          scope?: string;
          agent_id?: string | null;
          title: string;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_type?: string;
          report_date?: string;
          scope?: string;
          agent_id?: string | null;
          title?: string;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          call_log_id: string | null;
          followup_id: string | null;
          author_id: string;
          content: string;
          is_pinned: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          call_log_id?: string | null;
          followup_id?: string | null;
          author_id: string;
          content: string;
          is_pinned?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          call_log_id?: string | null;
          followup_id?: string | null;
          author_id?: string;
          content?: string;
          is_pinned?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_notes_call_log_id_fkey";
            columns: ["call_log_id"];
            referencedRelation: "call_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_notes_followup_id_fkey";
            columns: ["followup_id"];
            referencedRelation: "follow_ups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_notes_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_agent: { Args: Record<string, never>; Returns: boolean };
      current_agent_id: { Args: Record<string, never>; Returns: string };
      ensure_current_user_profile: {
        Args: { requested_role?: string | null };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      refresh_dashboard_stats: {
        Args: { p_stat_date?: string };
        Returns: Database["public"]["Tables"]["dashboard_stats"]["Row"];
      };
    };
    Enums: {
      lead_tier: LeadTier;
      lead_status: LeadStatus;
      agent_status: AgentStatus;
      call_direction: CallDirection;
      call_status: CallStatus;
      followup_status: FollowupStatus;
      followup_priority: FollowupPriority;
    };
  };
}

// Convenience row aliases
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type CallLogRow = Database["public"]["Tables"]["call_logs"]["Row"];
export type FollowupRow = Database["public"]["Tables"]["follow_ups"]["Row"];
export type NoteRow = Database["public"]["Tables"]["lead_notes"]["Row"];
export type SystemSettingsRow = Database["public"]["Tables"]["system_settings"]["Row"];

export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];
export type CallLogInsert = Database["public"]["Tables"]["call_logs"]["Insert"];
export type CallLogUpdate = Database["public"]["Tables"]["call_logs"]["Update"];
export type FollowupInsert = Database["public"]["Tables"]["follow_ups"]["Insert"];
export type FollowupUpdate = Database["public"]["Tables"]["follow_ups"]["Update"];
export type NoteInsert = Database["public"]["Tables"]["lead_notes"]["Insert"];
export type NoteUpdate = Database["public"]["Tables"]["lead_notes"]["Update"];

/** Joined agent with profile fields */
export type AgentWithProfile = AgentRow & {
  profiles: Pick<ProfileRow, "email" | "full_name" | "avatar_url" | "phone"> | null;
};

/** Call log with lead + agent names for UI */
export type CallLogWithRelations = CallLogRow & {
  leads: Pick<LeadRow, "id" | "full_name"> | null;
  agents: (AgentRow & { profiles: Pick<ProfileRow, "full_name"> | null }) | null;
};

export type LeadWithAgent = LeadRow & {
  agents: (AgentRow & { profiles: Pick<ProfileRow, "full_name" | "email"> | null }) | null;
};

export type FollowupWithRelations = FollowupRow & {
  leads: Pick<LeadRow, "id" | "full_name"> | null;
  agents: (AgentRow & { profiles: Pick<ProfileRow, "full_name"> | null }) | null;
};

export type NoteWithAuthor = NoteRow & {
  profiles: Pick<ProfileRow, "full_name" | "email" | "avatar_url"> | null;
};
