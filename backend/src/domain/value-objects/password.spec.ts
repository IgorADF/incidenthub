import { describe, expect, it } from "vitest";
import { Password } from "./password";

describe("Password value object", () => {
	it("should parse a non-empty password", () => {
		expect(Password.parse("thisismysecret")).toBe("thisismysecret");
	});

	it("should reject an empty string", () => {
		expect(Password.safeParse("").success).toBe(false);
	});

	it("should reject a password longer than 65 characters", () => {
		expect(Password.safeParse("a".repeat(66)).success).toBe(false);
	});

	it("should accept a password with exactly 65 characters", () => {
		const password = "a".repeat(65);
		expect(Password.parse(password)).toBe(password);
	});

	it("should reject a password with less than 8 characters", () => {
		expect(Password.safeParse("a".repeat(7)).success).toBe(false);
	});
});
