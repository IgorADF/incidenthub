import { z } from "zod";

const envSchema = z.object({
	VITE_API_URL: z.url("Missing or invalid VITE_API_URL"),
});

const parsed = envSchema.parse(import.meta.env);

export const envs = parsed;
