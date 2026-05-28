import { z } from "zod";
import { DATA_MANAGEMENT_RESOURCES } from "@/types/data-management";

const uuid = z.string().uuid();
const uuidList = z.array(uuid).min(1).max(500);

export const trashListQuerySchema = z.object({
  resource: z.enum(DATA_MANAGEMENT_RESOURCES),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const dataManagementActionSchema = z.discriminatedUnion("resource", [
  z.object({
    resource: z.literal("leads"),
    action: z.literal("delete"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("leads"),
    action: z.literal("bulk_delete"),
    ids: uuidList,
  }),
  z.object({
    resource: z.literal("leads"),
    action: z.literal("restore"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("call_logs"),
    action: z.literal("delete"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("call_logs"),
    action: z.literal("delete_old"),
    olderThanDays: z.number().int().min(1).max(3650),
  }),
  z.object({
    resource: z.literal("call_logs"),
    action: z.literal("bulk_cleanup"),
    olderThanDays: z.number().int().min(1).max(3650),
  }),
  z.object({
    resource: z.literal("follow_ups"),
    action: z.literal("delete"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("follow_ups"),
    action: z.literal("delete_completed"),
  }),
  z.object({
    resource: z.literal("agents"),
    action: z.literal("deactivate"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("agents"),
    action: z.literal("soft_delete"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("trash"),
    entity: z.enum(DATA_MANAGEMENT_RESOURCES),
    action: z.literal("restore"),
    id: uuid,
  }),
  z.object({
    resource: z.literal("trash"),
    entity: z.enum(DATA_MANAGEMENT_RESOURCES),
    action: z.literal("permanent_delete"),
    id: uuid,
    confirmPermanent: z.literal(true),
  }),
]);

export type DataManagementActionInput = z.infer<typeof dataManagementActionSchema>;
