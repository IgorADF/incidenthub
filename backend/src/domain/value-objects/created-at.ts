import z from "zod";

export const CreatedAt = z.date();
export type CreatedAt = z.infer<typeof CreatedAt>;
