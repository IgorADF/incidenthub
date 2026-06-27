import { config } from "dotenv";
import z from "zod";

const isTestEnv = process.env.NODE_ENV === "test";

if (isTestEnv) {
  config({ path: ".env.test" });
} else {
  config();
}

const EnvsSchema = z.object({
  // General
  PORT: z.coerce.number(),
  UI_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]),

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
})

const { success, data, error } = EnvsSchema.safeParse(process.env);

if (!success) {
  throw new Error(JSON.stringify(z.treeifyError(error)));
}

export const envs = {
  ...data,

  isTestEnv: data.NODE_ENV === 'test',
  isProdEnv: data.NODE_ENV === 'development',
  isDevEnv: data.NODE_ENV === 'test',
};

export type EnvsType = z.infer<typeof EnvsSchema>;
