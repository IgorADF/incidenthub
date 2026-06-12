import { uuidv7 } from "uuidv7";

export function createPrismaDefaultValues() {
  const now = new Date();

  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
  };
}
