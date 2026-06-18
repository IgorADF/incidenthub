import { describe, it, expect } from "vitest";
import { CreatedAt } from "./created-at";

describe("CreatedAt value object", () => {
  it("should parse a valid Date object", () => {
    const now = new Date();

    expect(CreatedAt.parse(now)).toBe(now);
  });

  it("should reject a date string", () => {
    expect(CreatedAt.safeParse("2024-01-01T00:00:00.000Z").success).toBe(false);
  });

  it("should reject a number timestamp", () => {
    expect(CreatedAt.safeParse(Date.now()).success).toBe(false);
  });

  it("should reject an invalid Date object", () => {
    expect(CreatedAt.safeParse(new Date("invalid")).success).toBe(false);
  });
});
