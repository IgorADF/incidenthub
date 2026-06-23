import z from "zod";
export const UUIDv7 = z.uuidv7();
export type UUIDv7 = z.infer<typeof UUIDv7>;
