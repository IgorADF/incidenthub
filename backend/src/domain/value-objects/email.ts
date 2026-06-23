import z from "zod";
export const Email = z.email();
export type Email = z.infer<typeof Email>;
