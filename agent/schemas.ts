import { z } from "zod";

export const giftIdeaSchema = z.object({
  title: z.string(),
  priceRange: z.string(),
  whyItFits: z.string(),
  searchQuery: z.string(),
  purchaseLink: z.string().optional(),
});

export const researchOutSchema = z.object({
  clarifyingQuestions: z.array(z.string()),
  inferredInterests: z.array(z.string()),
  giftIdeas: z.array(giftIdeaSchema),
  followUpWindowSuggestion: z.object({
    daysFromNow: z.number(),
    rationale: z.string(),
  }),
});

export const incidentTypeSchema = z.enum([
  "work_deadline",
  "missed_meeting",
  "forgot_birthday",
  "forgot_anniversary",
  "late_reply",
  "other",
]);

export const alibiPolicySchema = z.enum([
  "none",
  "light_framing",
  "detailed_explanation",
]);

export const reasonOutSchema = z.object({
  severity: z.enum(["low", "med", "high"]),
  tone: z.enum(["humorous", "contrite", "brief"]),
  incidentType: incidentTypeSchema,
  alibiPolicy: alibiPolicySchema,
  budgetRange: z.tuple([z.number(), z.number()]),
  plan: z.array(z.string()),
  /** 2–4 bullets: rules the writer must follow (e.g. no excuses, brevity). */
  writingRules: z.array(z.string()).min(2).max(4),
  risks: z.array(z.string()),
});

export const writeOutSchema = z.object({
  apologyMessage: z.string(),
  followUpMessage: z.string(),
  optionalLightFraming: z.string().optional(),
});

export type IncidentType = z.infer<typeof incidentTypeSchema>;
export type AlibiPolicy = z.infer<typeof alibiPolicySchema>;
export type ResearchOut = z.infer<typeof researchOutSchema>;
export type ReasonOut = z.infer<typeof reasonOutSchema>;
export type WriteOut = z.infer<typeof writeOutSchema>;
