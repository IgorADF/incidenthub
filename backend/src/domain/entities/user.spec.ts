import { describe, it, expect } from "vitest";
import { User } from "./user";
import { ValidationError } from "./errors/ValidationError";
import { DefaultEntity } from "./_default";

const baseUser = {
  organizationId: DefaultEntity.generateUUIDv7(),
  name: "John Doe",
  email: "john@example.com",
  password: "secret",
  type: "ADMIN" as const,
};

describe("User entity", () => {
  it("should create a user with valid props", () => {
    const user = User.create(baseUser);

    expect(user.getProps().email).toBe("john@example.com");
    expect(user.getProps().type).toBe("ADMIN");
    expect(user.getProps().id).toBeDefined();
  });

  it("should accept a name with exactly 1 character", () => {
    expect(() => User.create({ ...baseUser, name: "A" })).not.toThrow();
  });

  it("should accept a name with exactly 50 characters", () => {
    expect(() => User.create({ ...baseUser, name: "a".repeat(50) })).not.toThrow();
  });

  it("should reject an empty name", () => {
    expect(() => User.create({ ...baseUser, name: "" })).toThrow(
      ValidationError,
    );
  });

  it("should reject a name longer than 50 characters", () => {
    expect(() => User.create({ ...baseUser, name: "a".repeat(51) })).toThrow(
      ValidationError,
    );
  });

  it("should reject an invalid email", () => {
    expect(() => User.create({ ...baseUser, email: "not-an-email" })).toThrow(
      ValidationError,
    );
  });

  it("should accept a password with exactly 1 character", () => {
    expect(() => User.create({ ...baseUser, password: "a" })).not.toThrow();
  });

  it("should accept a password with exactly 65 characters", () => {
    expect(() =>
      User.create({ ...baseUser, password: "a".repeat(65) }),
    ).not.toThrow();
  });

  it("should reject an empty password", () => {
    expect(() => User.create({ ...baseUser, password: "" })).toThrow(
      ValidationError,
    );
  });

  it("should reject a password longer than 65 characters", () => {
    expect(() =>
      User.create({ ...baseUser, password: "a".repeat(66) }),
    ).toThrow(ValidationError);
  });
});
