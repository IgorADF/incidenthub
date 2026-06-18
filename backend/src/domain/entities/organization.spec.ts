import { describe, it, expect } from "vitest";
import { Organization } from "./organization";
import { ValidationError } from "./errors/ValidationError";

describe("Organization entity", () => {
  it("should create an organization with a valid name", () => {
    const organization = Organization.create({ name: "Acme Corp" });

    expect(organization.getProps().name).toBe("Acme Corp");
    expect(organization.getProps().id).toBeDefined();
    expect(organization.getProps().createdAt).toBeDefined();
  });

  it("should accept a name with exactly 1 character", () => {
    expect(() => Organization.create({ name: "A" })).not.toThrow();
  });

  it("should accept a name with exactly 50 characters", () => {
    expect(() => Organization.create({ name: "a".repeat(50) })).not.toThrow();
  });

  it("should reject an empty name", () => {
    expect(() => Organization.create({ name: "" })).toThrow(ValidationError);
  });

  it("should reject a name longer than 50 characters", () => {
    expect(() => Organization.create({ name: "a".repeat(51) })).toThrow(
      ValidationError,
    );
  });
});
