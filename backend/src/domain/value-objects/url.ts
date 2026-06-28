import z from "zod";
export const Url = z.url().min(1).max(150).trim();
export type Url = z.infer<typeof Url>;
