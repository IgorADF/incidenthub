import { describe, it, expect } from "vitest";
import { Url } from "./url";

describe("Url value object", () => {
  it("should parse a valid HTTPS URL", () => {
    expect(Url.parse("https://example.com/health")).toBe(
      "https://example.com/health",
    );
  });

  it("should parse a valid HTTP URL", () => {
    expect(Url.parse("http://example.com")).toBe("http://example.com");
  });

  it("should reject a string that is not a URL", () => {
    expect(Url.safeParse("not-a-url").success).toBe(false);
  });

  it("should reject an empty string", () => {
    expect(Url.safeParse("").success).toBe(false);
  });

  it("should reject a URL longer than 150 characters", () => {
    const longUrl = `https://example.com/${"a".repeat(150)}`;

    expect(Url.safeParse(longUrl).success).toBe(false);
  });
});
