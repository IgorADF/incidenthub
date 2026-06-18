import { describe, it, expect } from "vitest";
import { URL } from "./url";

describe("URL value object", () => {
  it("should parse a valid HTTPS URL", () => {
    expect(URL.parse("https://example.com/health")).toBe(
      "https://example.com/health",
    );
  });

  it("should parse a valid HTTP URL", () => {
    expect(URL.parse("http://example.com")).toBe("http://example.com");
  });

  it("should reject a string that is not a URL", () => {
    expect(URL.safeParse("not-a-url").success).toBe(false);
  });

  it("should reject an empty string", () => {
    expect(URL.safeParse("").success).toBe(false);
  });

  it("should reject a URL longer than 150 characters", () => {
    const longUrl = `https://example.com/${"a".repeat(150)}`;

    expect(URL.safeParse(longUrl).success).toBe(false);
  });
});
