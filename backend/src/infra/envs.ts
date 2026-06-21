import "dotenv/config";
import z from "zod";

const EnvsSchema = z.object({
  DATABASE_URL: z.url(),
  SMTP_URL: z.url().default("smtp://localhost:25"),
  SMTP_FROM: z.string().min(1).default("noreply@incidenthub.com"),
});

const { success, data, error } = EnvsSchema.safeParse(process.env);

if (!success) {
  throw new Error(JSON.stringify(z.treeifyError(error)));
}

export const envs = data;
export type EnvsType = z.infer<typeof EnvsSchema>;
