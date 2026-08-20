import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const registerSchema = authSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(40, "Display name is too long")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Only letters, numbers, spaces, _ and - are allowed"),
});

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(40, "Display name is too long")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Only letters, numbers, spaces, _ and - are allowed"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username is too long")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and _ only"),
  bio: z.string().trim().max(20, "Bio must be under 20 characters"),
  avatarEmoji: z
    .string()
    .trim()
    .max(4, "Pick a valid emoji")
    .optional()
    .default(""),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^0-9]/g, ""))
    .pipe(z.string().max(15, "Phone number is too long").optional().or(z.literal("")))
    .optional()
    .default(""),
});

export const gameSessionSchema = z.object({
  gameSlug: z.string().trim().min(1),
  score: z.number().int().min(0).max(1000000),
  durationMs: z.number().int().min(0).max(3600000),
  idempotencyKey: z.string().trim().min(8).max(128),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const mathStartSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
});

export const mathSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        value: z.union([z.number(), z.string()]),
      })
    )
    .min(1)
    .max(30),
});

export const dailyClaimSchema = z.object({});

export const notificationReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional().default([]),
  all: z.boolean().optional().default(false),
  olderThan: z.boolean().optional().default(false),
});

export const contactMessageAdminSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]),
  note: z.string().trim().max(1000).optional().default(""),
});

export const scratchClaimSchema = z.object({});

export const referralEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const mathDailySubmitSchema = z.object({
  answer: z
    .union([z.number(), z.string().trim().min(1, "Enter an answer")])
    .transform((v) => String(v).trim()),
});

export const withdrawalSubmitSchema = z.object({
  amount: z.number().int().min(1).max(1000000),
  method: z.enum(["bank_transfer", "mobile_wallet", "paypal"]),
  details: z.record(z.string().max(200)).optional().default({}),
});

export const withdrawalAdminSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional().default(""),
});