import { describe, expect, it } from "vitest";
import { Slug } from "./slug";

describe("Slug value object", () => {
	it("should parse a valid lowercase slug", () => {
		expect(Slug.parse("my-project")).toBe("my-project");
	});

	it("should parse a slug with numbers", () => {
		expect(Slug.parse("project-123")).toBe("project-123");
	});

	it("should strip a leading slash", () => {
		expect(Slug.parse("/my-project")).toBe("my-project");
	});

	it("should reject an empty string", () => {
		expect(Slug.safeParse("").success).toBe(false);
	});

	it("should reject a slug with only a leading slash", () => {
		expect(Slug.safeParse("/").success).toBe(false);
	});

	it("should reject uppercase letters", () => {
		expect(Slug.safeParse("My-Project").success).toBe(false);
	});

	it("should reject spaces", () => {
		expect(Slug.safeParse("my project").success).toBe(false);
	});

	it("should reject consecutive hyphens", () => {
		expect(Slug.safeParse("my--project").success).toBe(false);
	});

	it("should reject a trailing hyphen", () => {
		expect(Slug.safeParse("my-project-").success).toBe(false);
	});

	it("should reject a slug longer than 50 characters", () => {
		expect(Slug.safeParse("a".repeat(51)).success).toBe(false);
	});
});
