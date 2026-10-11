/**
 * FIX #2 — Input Sanitization & Zod Validation
 * Central schema definitions. Import and parse in every API route.
 */

import { z } from "zod";
import sanitizeHtml from "sanitize-html";

// ─── Sanitize helpers ────────────────────────────────────────────────────────

/** Strip all HTML tags from a string */
export function sanitize(str: string): string {
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim();
}

/** Sanitize all string values in an object recursively */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") result[k] = sanitize(v);
    else if (Array.isArray(v)) result[k] = v.map((i) => (typeof i === "string" ? sanitize(i) : i));
    else if (v && typeof v === "object") result[k] = sanitizeObject(v);
    else result[k] = v;
  }
  return result as T;
}

// ─── Reusable field types ─────────────────────────────────────────────────────

const safeStr = (max = 500) =>
  z.string().min(1).max(max).transform(sanitize);

const emailField = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  companyName: safeStr(100),
  industry: safeStr(60).optional().default("Technology"),
  name: safeStr(80),
  email: emailField,
  password: passwordField,
});

export const SetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordField,
});

export const ForgotPasswordSchema = z.object({
  email: emailField,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordField,
});

// ─── Batch schemas ────────────────────────────────────────────────────────────

export const CreateBatchSchema = z.object({
  name: safeStr(100),
  description: safeStr(500).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  durationInWeeks: z.number().int().min(1).max(52).optional().default(8),
});

export const AddUserToBatchSchema = z.object({
  role: z.enum(["MENTOR", "INTERN"]),
  email: emailField.optional(),
  name: safeStr(80).optional(),
  userId: mongoId.optional(),
});

// ─── Task schemas ─────────────────────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  batchId: mongoId,
  title: safeStr(150),
  description: safeStr(2000),
  assignedTo: z.array(mongoId).min(1, "Assign to at least one intern"),
  deadline: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  requiredProofType: z.enum(["GITHUB", "URL", "DOC", "IMAGE", "OTHER"]).default("GITHUB"),
  weekNumber: z.number().int().min(1).max(52),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
});

// ─── Submission schemas ───────────────────────────────────────────────────────

export const CreateSubmissionSchema = z.object({
  taskId: mongoId,
  batchId: mongoId,
  proofType: z.enum(["GITHUB", "URL", "DOC", "IMAGE", "OTHER"]),
  proofLink: z.string().url("Must be a valid URL").max(500),
  whatWasImplemented: safeStr(500),
  whatWasLearned: safeStr(1000),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

export const ReviewSubmissionSchema = z.object({
  status: z.enum(["APPROVED", "REWORK"]),
  remarks: safeStr(1000).optional().default(""),
});

// ─── Report schemas ───────────────────────────────────────────────────────────

export const CreateReportSchema = z.object({
  batchId: mongoId,
  weekNumber: z.number().int().min(1).max(52),
  tasksWorkedOn: z.array(mongoId).optional().default([]),
  workDone: safeStr(2000),
  challenges: safeStr(1000),
  learnings: safeStr(1000),
  hoursSpent: z.number().min(0).max(168).optional().default(0),
});

export const ReportFeedbackSchema = z.object({
  mentorFeedback: safeStr(1000),
});

// ─── Evaluation schemas ───────────────────────────────────────────────────────

export const CriteriaScoreSchema = z.object({
  key: z.string().max(50),
  label: z.string().max(80),
  score: z.number().min(0).max(10),
  weight: z.number().min(0).max(100),
});

export const CreateEvaluationSchema = z.object({
  batchId: mongoId,
  internId: mongoId,
  criteriaScores: z.array(CriteriaScoreSchema).min(1),
  remarks: safeStr(2000).optional().default(""),
  completed: z.boolean().optional().default(false),
});

// ─── Helper: parse + respond ──────────────────────────────────────────────────

import { NextResponse } from "next/server";

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    return {
      success: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}
