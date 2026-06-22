import { describe, it, expect } from "vitest";
import { Incident } from "./incident";
import { ValidationEntitiesError } from "./errors/ValidationEntitiesError";
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
    expect(() => Incident.create({ ...baseIncident, emailsSent: -1 })).toThrow(
      ValidationEntitiesError,
    );
  });

  it("should accept a resolvedAt date", () => {
    const resolvedAt = new Date(now.getTime() + 1000);

    const incident = Incident.create({
      ...baseIncident,
      resolvedAt,
    });

    expect(incident.getProps().resolvedAt).toBe(resolvedAt);
  });

  describe("Incident domain methods", () => {
    it("resolve should set resolvedAt to the given date", () => {
      const incident = Incident.create(baseIncident);
      const resolvedAt = new Date(now.getTime() + 5000);

      const resolved = incident.resolve(resolvedAt);

      expect(resolved.getProps().resolvedAt).toEqual(resolvedAt);
      expect(incident.getProps().resolvedAt).toBeNull();
    });

    it("resolve should reject an invalid date", () => {
      const incident = Incident.create(baseIncident);

      expect(() => incident.resolve(new Date("invalid"))).toThrow(
        ValidationEntitiesError,
      );
    });

    it("incrementEmailsSent should add 1 to emailsSent", () => {
      const incident = Incident.create(baseIncident);

      const one = incident.incrementEmailsSent();
      const two = one.incrementEmailsSent();

      expect(one.getProps().emailsSent).toBe(1);
      expect(two.getProps().emailsSent).toBe(2);
      expect(incident.getProps().emailsSent).toBe(0);
    });

    it("resolve and incrementEmailsSent should be chainable", () => {
      const incident = Incident.create(baseIncident);
      const resolvedAt = new Date(now.getTime() + 5000);

      const resolved = incident
        .incrementEmailsSent()
        .incrementEmailsSent()
        .resolve(resolvedAt);

      expect(resolved.getProps().emailsSent).toBe(2);
      expect(resolved.getProps().resolvedAt).toEqual(resolvedAt);
    });
  });
});
