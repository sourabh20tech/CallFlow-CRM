import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

import { loginSchema, userRoleSchema } from "@/lib/auth/schemas";

export { loginSchema, userRoleSchema };

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: userRoleSchema.optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type { LoginFormValues } from "@/lib/auth/schemas";
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const agentStatusSchema = z.enum(["available", "busy", "away", "offline"]);

export const phoneSchema = z
  .string()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .regex(/^[\d\s+\-().]+$/, "Invalid phone number format");

export const createAgentSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  isActive: z.boolean().optional().default(true),
});

export const updateAgentSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  department: z.string().min(2).optional(),
  status: agentStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

export const resetAgentPasswordSchema = z.object({
  password: passwordSchema,
});

export type CreateAgentFormValues = z.infer<typeof createAgentSchema>;
export type UpdateAgentFormValues = z.infer<typeof updateAgentSchema>;
export type ResetAgentPasswordFormValues = z.infer<typeof resetAgentPasswordSchema>;

export const callStatusSchema = z.enum([
  "connected",
  "busy",
  "no_answer",
  "callback",
  "interested",
  "not_interested",
]);

export const callDirectionSchema = z.enum(["inbound", "outbound"]);

export const logCallSchema = z.object({
  leadId: z.string().min(1, "Select a lead"),
  direction: callDirectionSchema,
  status: callStatusSchema,
  durationSeconds: z.number().min(0),
  summary: z.string().max(2000).optional(),
  agentId: z.string().uuid().optional(),
});

export const updateCallSchema = z.object({
  status: callStatusSchema.optional(),
  durationSeconds: z.coerce.number().min(0).optional(),
  summary: z.string().max(2000).optional(),
  direction: callDirectionSchema.optional(),
});

export const callNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(5000),
});

export type LogCallFormValues = z.infer<typeof logCallSchema>;
export type UpdateCallFormValues = z.infer<typeof updateCallSchema>;
export type CallNoteFormValues = z.infer<typeof callNoteSchema>;

export const followupPrioritySchema = z.enum(["low", "medium", "high"]);
export const followupStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const scheduleFollowupSchema = z.object({
  leadId: z.string().min(1, "Select a lead"),
  title: z.string().min(2, "Title is required"),
  description: z.string().max(2000).optional(),
  dueAt: z.string().min(1, "Due date is required"),
  assignedAgentId: z.string().optional(),
  priority: followupPrioritySchema,
});

export const updateFollowupSchema = z.object({
  leadId: z.string().min(1).optional(),
  title: z.string().min(2).optional(),
  description: z.string().max(2000).optional(),
  dueAt: z.string().optional(),
  assignedAgentId: z.string().optional(),
  priority: followupPrioritySchema.optional(),
  status: followupStatusSchema.optional(),
});

export type ScheduleFollowupFormValues = z.infer<typeof scheduleFollowupSchema>;
export type UpdateFollowupFormValues = z.infer<typeof updateFollowupSchema>;

export const leadStatusSchema = z.string().min(1, "Status is required");

export const leadForceSchema = z.enum(["standard", "premium"]);

/** @deprecated Use leadForceSchema instead */
export const leadTierSchema = leadForceSchema;

const leadFieldsSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  tier: leadForceSchema.optional(),
  status: leadStatusSchema.optional(),
  source: z.string().max(120).optional(),
  assignedAgentId: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
});

export const leadFormSchema = leadFieldsSchema.refine(
  (data) => Boolean(data.email?.trim() || data.phone?.trim()),
  {
    message: "Email or phone is required",
    path: ["email"],
  },
);

export const createLeadSchema = leadFormSchema;

export const updateLeadSchema = leadFieldsSchema.partial().extend({
  fullName: z.string().min(2).optional(),
});

export const assignLeadSchema = z.object({
  assignedAgentId: z.string().nullable(),
});

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
});

export const leadNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(5000),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type CreateLeadFormValues = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormValues = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusFormValues = z.infer<typeof updateLeadStatusSchema>;
export type LeadNoteFormValues = z.infer<typeof leadNoteSchema>;
