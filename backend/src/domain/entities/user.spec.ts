import { describe, expect, it } from "vitest";
import { DefaultEntity } from "./_default";
import { ValidationEntitiesError } from "./errors/ValidationEntitiesError";
import { User, UserWithPassword } from "./user";

const baseUser = {
	organizationId: DefaultEntity.generateUUIDv7(),
	name: "John Doe",
	normalizedName: "john doe",
	email: "john@example.com",
	type: "ADMIN" as const,
};

const baseUserWithPassword = {
	...baseUser,
	password: "thesecret",
};

describe("User entity", () => {
	it("should create a passwordless user with valid props", () => {
		const user = User.create(baseUser);

		expect(user.getProps().email).toBe("john@example.com");
		expect(user.getProps().type).toBe("ADMIN");
		expect(user.getProps().id).toBeDefined();
		expect(user.getProps()).not.toHaveProperty("password");
	});

	it("should reject a name with less than 3 character", () => {
		expect(() => User.create({ ...baseUser, name: "ab" })).toThrow();
	});

	it("should accept a name with exactly 50 characters", () => {
		expect(() =>
			User.create({ ...baseUser, name: "a".repeat(50) }),
		).not.toThrow();
	});

	it("should reject an empty name", () => {
		expect(() => User.create({ ...baseUser, name: "" })).toThrow(
			ValidationEntitiesError,
		);
	});

	it("should reject a name longer than 50 characters", () => {
		expect(() => User.create({ ...baseUser, name: "a".repeat(51) })).toThrow(
			ValidationEntitiesError,
		);
	});

	it("should reject an invalid email", () => {
		expect(() => User.create({ ...baseUser, email: "not-an-email" })).toThrow(
			ValidationEntitiesError,
		);
	});
});

describe("UserWithPassword entity", () => {
	it("should create a user with password", () => {
		const user = UserWithPassword.create(baseUserWithPassword);

		expect(user.getProps()).toEqual(
			expect.objectContaining({
				email: "john@example.com",
				password: "thesecret",
			}),
		);
	});

	it("should reject a password with less than 8 character", () => {
		expect(() =>
			UserWithPassword.create({ ...baseUserWithPassword, password: "1234567" }),
		).toThrow();
	});

	it("should accept a password with exactly 65 characters", () => {
		expect(() =>
			UserWithPassword.create({
				...baseUserWithPassword,
				password: "a".repeat(65),
			}),
		).not.toThrow();
	});

	it("should reject an empty password", () => {
		expect(() =>
			UserWithPassword.create({ ...baseUserWithPassword, password: "" }),
		).toThrow(ValidationEntitiesError);
	});

	it("should reject a password longer than 65 characters", () => {
		expect(() =>
			UserWithPassword.create({
				...baseUserWithPassword,
				password: "a".repeat(66),
			}),
		).toThrow(ValidationEntitiesError);
	});
});
