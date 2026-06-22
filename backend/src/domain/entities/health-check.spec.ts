import { describe, it, expect } from "vitest";
import { HealthCheck } from "./health-check";
import { ValidationEntitiesError } from "./errors/ValidationEntitiesError";
import { DefaultEntity } from "./_default";

const baseHealthCheck = {
  serviceId: DefaultEntity.generateUUIDv7(),
  url: "https://api.example.com/health",
  requestTime: 120,
  isError: false,
  timedOut: false,
  responseStatus: 200,
  responseJsonData: null,
};

describe("HealthCheck entity", () => {
  it("should create a health check with valid props", () => {
    const healthCheck = HealthCheck.create(baseHealthCheck);

    expect(healthCheck.getProps().url).toBe("https://api.example.com/health");
    expect(healthCheck.getProps().requestTime).toBe(120);
    expect(healthCheck.getProps().responseStatus).toBe(200);
    expect(healthCheck.getProps().id).toBeDefined();
  });

  it("should accept responseStatus at the lower boundary (0 = no response)", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 0 }),
    ).not.toThrow();
  });

  it("should accept responseStatus at the upper boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 599 }),
    ).not.toThrow();
  });

  it("should reject responseStatus below the lower boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: -1 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject responseStatus above the upper boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 600 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should accept requestTime of 0 (instant failure)", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, requestTime: 0 }),
    ).not.toThrow();
  });

  it("should reject negative requestTime", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, requestTime: -1 }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject an invalid URL", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, url: "not-a-url" }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should accept responseJsonData as a string", () => {
    const healthCheck = HealthCheck.create({
      ...baseHealthCheck,
      responseJsonData: '{"status":"ok"}',
    });

    expect(healthCheck.getProps().responseJsonData).toBe('{"status":"ok"}');
  });
});
