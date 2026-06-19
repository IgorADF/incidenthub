import { describe, it, expect } from "vitest";
import { HealthCheck } from "./health-check";
import { ValidationError } from "./errors/ValidationError";
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

  it("should accept responseStatus at the lower boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 100 }),
    ).not.toThrow();
  });

  it("should accept responseStatus at the upper boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 599 }),
    ).not.toThrow();
  });

  it("should reject responseStatus below the lower boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 99 }),
    ).toThrow(ValidationError);
  });

  it("should reject responseStatus above the upper boundary", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, responseStatus: 600 }),
    ).toThrow(ValidationError);
  });

  it("should accept the minimum requestTime", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, requestTime: 1 }),
    ).not.toThrow();
  });

  it("should reject non-positive requestTime", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, requestTime: 0 }),
    ).toThrow(ValidationError);
  });

  it("should reject an invalid URL", () => {
    expect(() =>
      HealthCheck.create({ ...baseHealthCheck, url: "not-a-url" }),
    ).toThrow(ValidationError);
  });

  it("should accept responseJsonData as a string", () => {
    const healthCheck = HealthCheck.create({
      ...baseHealthCheck,
      responseJsonData: '{"status":"ok"}',
    });

    expect(healthCheck.getProps().responseJsonData).toBe('{"status":"ok"}');
  });
});
