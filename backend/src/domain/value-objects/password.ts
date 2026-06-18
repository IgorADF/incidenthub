import z from "zod";
export const Password = z.string().min(1).max(65);
