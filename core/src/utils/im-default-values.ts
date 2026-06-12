import { uuidv7 } from "uuidv7";

export function createIMDefaultValues() {
  const now = new Date();

  return {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
  };
}
