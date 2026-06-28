import z from "zod";
export const Email = z.email().trim();
export type Email = z.infer<typeof Email>;
