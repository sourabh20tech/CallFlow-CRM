import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address");

export const userRoleSchema = z.enum(["admin", "agent"], {
  message: "Select admin or agent portal",
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  role: userRoleSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
