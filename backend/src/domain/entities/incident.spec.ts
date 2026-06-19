import { describe, it, expect } from "vitest";
import { Incident } from "./incident";
import { ValidationError } from "./errors/ValidationError";
import { DefaultEntity } from "./_default";

const now = new Date();
const baseIncident = {
  serviceId: DefaultEntity.generateUUIDv7(),
  startedAt: now,
  resolvedAt: null,
  emailsSent: 0,
};

describe("Incident entity", () => {
  it("should create an incident with valid props", () => {
    const incident = Incident.create(baseIncident);

    expect(incident.getProps().serviceId).toBe(baseIncident.serviceId);
    expect(incident.getProps().startedAt).toBe(now);
    expect(incident.getProps().resolvedAt).toBeNull();
    expect(incident.getProps().emailsSent).toBe(0);
    expect(incident.getProps().id).toBeDefined();
  });

  it("should accept emailsSent at the lower boundary", () => {
    expect(() =>
      Incident.create({ ...baseIncident, emailsSent: 0 }),
    ).not.toThrow();
  });

  it("should reject emailsSent below the lower boundary", () => {
    expect(() =>
      Incident.create({ ...baseIncident, emailsSent: -1 }),
    ).toThrow(ValidationError);
  });

  it("should accept a resolvedAt date", () => {
    const resolvedAt = new Date(now.getTime() + 1000);

    const incident = Incident.create({
      ...baseIncident,
      resolvedAt,
    });

    expect(incident.getProps().resolvedAt).toBe(resolvedAt);
  });
});
