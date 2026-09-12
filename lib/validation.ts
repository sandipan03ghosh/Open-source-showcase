import { z } from "zod";

const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .url(message)
    .refine(
      (url) => {
        try {
          return ["http:", "https:"].includes(new URL(url).protocol);
        } catch {
          return false;
        }
      },
      { message: "Only HTTP and HTTPS URLs are allowed." },
    );

export const connectRepositorySchema = z.object({
  repoInput: z
    .string()
    .trim()
    .min(3, "Enter a GitHub repository, e.g. vercel/next.js or a GitHub URL.")
    .max(200, "That doesn't look like a valid repository reference."),

  demoUrl: z.union([httpUrl("Enter a valid demo URL."), z.literal("")]).optional(),

  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
});

export type ConnectRepositoryInput = z.infer<typeof connectRepositorySchema>;

const trimmedOptional = () =>
  z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined));

export const repositorySearchParamsSchema = z.object({
  query: trimmedOptional(),
  language: trimmedOptional(),
  technology: trimmedOptional(),
  topic: trimmedOptional(),
  license: trimmedOptional(),
  org: trimmedOptional(),
  developer: trimmedOptional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  sort: z.enum(["stars", "trending", "recent-updated", "recent-added"]).optional(),
  page: z.coerce.number().int().min(0).max(1000).optional().default(0),
});

export type RepositorySearchParamsInput = z.infer<typeof repositorySearchParamsSchema>;

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5, "Rating must be 1-5."),
  body: z.string().trim().max(2000, "Keep reviews under 2000 characters.").optional(),
});

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment can't be empty.")
    .max(2000, "Keep comments under 2000 characters."),
  parentId: z.string().cuid().optional(),
});

export const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be under 80 characters."),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const reportSchema = z.object({
  targetType: z.enum(["REPOSITORY", "COMMENT", "USER"]),
  targetId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(5, "Please describe the issue (at least 5 characters).")
    .max(500, "Keep it under 500 characters."),
});
