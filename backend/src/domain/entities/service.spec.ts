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
    expect(service.getProps().status).toBe("unknown");
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
});
