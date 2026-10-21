import { z } from "zod";

export const CRM_MODULES = [
  "dashboard",
  "leads",
  "contacts",
  "companies",
  "dealers",
  "pipeline",
  "follow-ups",
  "visits",
  "reports",
  "users",
  "settings"
] as const;

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type CrmModule = (typeof CRM_MODULES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export interface PageResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SelectOption {
  label: string;
  value: string;
}

export { z } from "zod";
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(7).max(20);
