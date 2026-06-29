import path from "node:path";
import { config } from "dotenv";
import z from "zod";

const isTestEnv = process.env.NODE_ENV === "test";

let envFilePath: string;

if (isTestEnv) {
	envFilePath = path.resolve(import.meta.dirname, "../../.env.test");
} else {
	envFilePath = path.resolve(import.meta.dirname, "../../.env");
}

config({ path: envFilePath });

const EnvsSchema = z.object({
	// General
	PORT: z.coerce.number(),
	UI_URL: z.url(),
	NODE_ENV: z.enum(["development", "test", "production"]),

	// JWT
	AUTH_JWT_SECRET: z.string().min(16),
	FORGOT_PASSWORD_JWT_SECRET: z.string().min(16),

	// Cookie
	COOKIE_NAME: z.string().default("ih_session"),
	COOKIE_DOMAIN: z.string().optional(),
	COOKIE_SECURE: z.coerce.boolean().default(false),
	COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
	COOKIE_PATH: z.string().default("/"),

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

export const envs = {
	...data,

	isTestEnv: data.NODE_ENV === "test",
	isProdEnv: data.NODE_ENV === "development",
	isDevEnv: data.NODE_ENV === "test",
};

export type EnvsType = z.infer<typeof EnvsSchema>;
