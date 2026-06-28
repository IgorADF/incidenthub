import { describe, expect, it } from "vitest";
import { Email } from "./email";

describe("Email value object", () => {
	it("should parse a valid email", () => {
		expect(Email.parse("admin@acme.com")).toBe("admin@acme.com");
	});

	it("should parse a valid email with subdomain", () => {
		expect(Email.parse("user@mail.example.com")).toBe("user@mail.example.com");
	});

	it("should reject a string without @", () => {
		expect(Email.safeParse("not-an-email").success).toBe(false);
	});

	it("should reject a string without a domain", () => {
		expect(Email.safeParse("admin@").success).toBe(false);
	});

	it("should reject a string without a local part", () => {
		expect(Email.safeParse("@example.com").success).toBe(false);
	});
});
