import "dotenv/config";
import z from "zod";

const EnvsSchema = z.object({
  // General
  PORT: z.coerce.number(),
  UI_URL: z.url(),

  // JWT
  AUTH_JWT_SECRET: z.string().min(16),
  FORGOT_PASSWORD_JWT_SECRET: z.string().min(16),

  // DB
  DATABASE_URL: z.url(),

  // Redis
  REDIS_URL: z.url(),

  // SMTP
  SMTP_URL: z.url().default("smtp://localhost:25"),
  SMTP_FROM: z.string().min(1).default("noreply@incidenthub.com"),
});

const { success, data, error } = EnvsSchema.safeParse(process.env);

if (!success) {
  throw new Error(JSON.stringify(z.treeifyError(error)));
}

export const envs = data;
export type EnvsType = z.infer<typeof EnvsSchema>;
