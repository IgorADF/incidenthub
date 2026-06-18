import z from "zod";
export const URL = z.url().min(1).max(150);
