import z from "zod";
export const Password = z.string().min(8).max(65);
export type Password = z.infer<typeof Password>;
