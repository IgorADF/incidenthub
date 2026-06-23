import { describe, it, expect } from "vitest";
import { Service } from "./service";
import { ValidationEntitiesError } from "./errors/ValidationEntitiesError";
import { DefaultEntity } from "./_default";

const baseService = {
  projectId: DefaultEntity.generateUUIDv7(),
  name: "Backend Service",
  url: "https://api.example.com/health",
  intervalSeconds: 120,
  timeoutSeconds: 15,
  expectedResponseStatus: 204,
  incidentDetectionFails: 3,
  emailToAlert: "ops@example.com",
};

describe("Service entity", () => {
  it("should create a service with valid props", () => {
    const service = Service.create(baseService);

    expect(service.getProps().name).toBe("Backend Service");
    expect(service.getProps().status).toBe("CHECKING");
    expect(service.getProps().consecutivesIncidentDetectionFails).toBe(0);
    expect(service.getProps().enabled).toBe(true);
  });

  it("should accept a name with exactly 1 character", () => {
    expect(() => Service.create({ ...baseService, name: "A" })).not.toThrow();
  });

  it("should accept a name with exactly 50 characters", () => {
    expect(() =>
      Service.create({ ...baseService, name: "a".repeat(50) }),
    ).not.toThrow();
  });

  it("should reject an empty name", () => {
    expect(() => Service.create({ ...baseService, name: "" })).toThrow(
      ValidationEntitiesError,
    );
  });

  it("should reject a name longer than 50 characters", () => {
    expect(() =>
      Service.create({ ...baseService, name: "a".repeat(51) }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should accept the minimum valid intervalSeconds", () => {
    expect(() =>
      Service.create({ ...baseService, intervalSeconds: 6, timeoutSeconds: 5 }),
    ).not.toThrow();
  });

  it("should accept intervalSeconds at the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, intervalSeconds: 9999 }),
    ).not.toThrow();
  });

  it("should reject intervalSeconds below the lower boundary", () => {
    expect(() =>
      Service.create({ ...baseService, intervalSeconds: 4 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject intervalSeconds above the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, intervalSeconds: 100000 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should accept timeoutSeconds at the lower boundary", () => {
    expect(() =>
      Service.create({ ...baseService, timeoutSeconds: 5 }),
    ).not.toThrow();
  });

  it("should accept timeoutSeconds at the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, timeoutSeconds: 20 }),
    ).not.toThrow();
  });

  it("should reject timeoutSeconds below the lower boundary", () => {
    expect(() => Service.create({ ...baseService, timeoutSeconds: 4 })).toThrow(
      ValidationEntitiesError,
    );
  });

  it("should reject timeoutSeconds above the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, timeoutSeconds: 21 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should accept expectedResponseStatus at the lower boundary", () => {
    expect(() =>
      Service.create({ ...baseService, expectedResponseStatus: 100 }),
    ).not.toThrow();
  });

  it("should accept expectedResponseStatus at the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, expectedResponseStatus: 599 }),
    ).not.toThrow();
  });

  it("should reject expectedResponseStatus below the lower boundary", () => {
    expect(() =>
      Service.create({ ...baseService, expectedResponseStatus: 99 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject expectedResponseStatus above the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, expectedResponseStatus: 600 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should accept incidentDetectionFails at the lower boundary", () => {
    expect(() =>
      Service.create({ ...baseService, incidentDetectionFails: 1 }),
    ).not.toThrow();
  });

  it("should accept incidentDetectionFails at the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, incidentDetectionFails: 99 }),
    ).not.toThrow();
  });

  it("should reject incidentDetectionFails below the lower boundary", () => {
    expect(() =>
      Service.create({ ...baseService, incidentDetectionFails: 0 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject incidentDetectionFails above the upper boundary", () => {
    expect(() =>
      Service.create({ ...baseService, incidentDetectionFails: 100 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject an invalid URL", () => {
    expect(() => Service.create({ ...baseService, url: "not-a-url" })).toThrow(
      ValidationEntitiesError,
    );
  });

  it("should reject timeoutSeconds equal to intervalSeconds", () => {
    expect(() =>
      Service.create({
        ...baseService,
        intervalSeconds: 30,
        timeoutSeconds: 30,
      }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject timeoutSeconds greater than intervalSeconds", () => {
    expect(() =>
      Service.create({
        ...baseService,
        intervalSeconds: 30,
        timeoutSeconds: 31,
      }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should expose structured validation issues", () => {
    try {
      Service.create({ ...baseService, name: "" });
      expect.fail("Expected ValidationEntitiesError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationEntitiesError);
      expect((error as ValidationEntitiesError).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "name",
            message: expect.any(String),
          }),
        ]),
      );
    }
  });

  it("should default currentIncidentId and lastCheckedAt to null on create", () => {
    const service = Service.create(baseService);

    expect(service.getProps().currentIncidentId).toBeNull();
    expect(service.getProps().lastCheckedAt).toBeNull();
  });

  describe("Service domain methods", () => {
    it("markChecking should set status to CHECKING", () => {
      const service = Service.create(baseService);
      const updated = service.markChecking();

      expect(updated.getProps().status).toBe("CHECKING");
      expect(service.getProps().status).toBe("CHECKING");
    });

    it("recordSuccess should reset consecutivesIncidentDetectionFails to 0", () => {
      const service = Service.create(baseService);
      const failing = service.recordFailure().recordFailure();
      expect(failing.getProps().consecutivesIncidentDetectionFails).toBe(2);

      const recovered = failing.recordSuccess();

      expect(recovered.getProps().consecutivesIncidentDetectionFails).toBe(0);
    });

    it("recordFailure should increment consecutivesIncidentDetectionFails by 1", () => {
      const service = Service.create(baseService);

      const one = service.recordFailure();
      const two = one.recordFailure();
      const three = two.recordFailure();

      expect(one.getProps().consecutivesIncidentDetectionFails).toBe(1);
      expect(two.getProps().consecutivesIncidentDetectionFails).toBe(2);
      expect(three.getProps().consecutivesIncidentDetectionFails).toBe(3);
    });

    it("recordFailure should cap at 99 (schema max)", () => {
      const service = Service.create(baseService);
      let current = service;
      for (let i = 0; i < 100; i++) {
        current = current.recordFailure();
      }

      expect(current.getProps().consecutivesIncidentDetectionFails).toBe(99);
    });

    it("markIncident should set status to INCIDENT", () => {
      const service = Service.create(baseService);

      const updated = service.markIncident();

      expect(updated.getProps().status).toBe("INCIDENT");
    });

    it("disable should set status to DISABLED and enabled to false", () => {
      const service = Service.create(baseService);

      const updated = service.disable();

      expect(updated.getProps().status).toBe("DISABLED");
      expect(updated.getProps().enabled).toBe(false);
    });

    it("enable should set status to CHECKING and enabled to true", () => {
      const service = Service.create(baseService).disable();

      const updated = service.enable();

      expect(updated.getProps().status).toBe("CHECKING");
      expect(updated.getProps().enabled).toBe(true);
    });

    it("markCheckedAt should set lastCheckedAt to the given date", () => {
      const service = Service.create(baseService);
      const date = new Date("2026-01-15T10:30:00Z");

      const updated = service.markCheckedAt(date);

      expect(updated.getProps().lastCheckedAt).toEqual(date);
    });

    it("markCheckedAt should reject an invalid date", () => {
      const service = Service.create(baseService);

      expect(() => service.markCheckedAt(new Date("invalid"))).toThrow(
        ValidationEntitiesError,
      );
    });

    it("setCurrentIncident should set currentIncidentId to a valid UUIDv7", () => {
      const service = Service.create(baseService);
      const incidentId = DefaultEntity.generateUUIDv7();

      const updated = service.setCurrentIncident(incidentId);

      expect(updated.getProps().currentIncidentId).toBe(incidentId);
    });

    it("setCurrentIncident should reject an invalid UUID", () => {
      const service = Service.create(baseService);

      expect(() => service.setCurrentIncident("not-a-uuid")).toThrow(
        ValidationEntitiesError,
      );
    });

    it("resolveCurrentIncident should set currentIncidentId to null", () => {
      const service = Service.create(baseService);
      const incidentId = DefaultEntity.generateUUIDv7();
      const withIncident = service.setCurrentIncident(incidentId);

      const resolved = withIncident.resolveCurrentIncident();

      expect(resolved.getProps().currentIncidentId).toBeNull();
    });

    it("domain methods should be chainable", () => {
      const incidentId = DefaultEntity.generateUUIDv7();
      const date = new Date("2026-01-15T10:30:00Z");

      const updated = Service.create(baseService)
        .recordFailure()
        .recordFailure()
        .recordFailure()
        .markIncident()
        .setCurrentIncident(incidentId)
        .markCheckedAt(date);

      expect(updated.getProps().consecutivesIncidentDetectionFails).toBe(3);
      expect(updated.getProps().status).toBe("INCIDENT");
      expect(updated.getProps().currentIncidentId).toBe(incidentId);
      expect(updated.getProps().lastCheckedAt).toEqual(date);
    });

    it("domain methods should not mutate the original instance", () => {
      const service = Service.create(baseService);

      service.recordFailure().markIncident();

      expect(service.getProps().consecutivesIncidentDetectionFails).toBe(0);
      expect(service.getProps().status).toBe("CHECKING");
    });
  });
});
