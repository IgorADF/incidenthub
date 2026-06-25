import { describe, it, expect, beforeEach } from "vitest";
import { ExecuteHealthCheck } from "./execute-health-check";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HttpPingerTestService } from "@domain/services/http-pinger";
import { NotificationsProducerTestService } from "@domain/services/notifications-producer";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestService } from "@domain/use-cases/utils/tests/service";
import { Incident } from "@domain/entities/incident";
import { DefaultEntity } from "@domain/entities/_default";

let uow: IMUOW;
let pinger: HttpPingerTestService;
let notifications: NotificationsProducerTestService;
let sut: ExecuteHealthCheck;

describe("ExecuteHealthCheck", () => {
  beforeEach(() => {
    uow = new IMUOW();
    pinger = new HttpPingerTestService();
    notifications = new NotificationsProducerTestService();
    sut = new ExecuteHealthCheck(uow, pinger, notifications);
  });

  async function setupService(overrides?: Parameters<typeof createTestService>[2]) {
    const { organization } = await createTestOrganization(uow);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project, overrides);
    return { service, project, organization };
  }

  it("should write a healthcheck and reset fails on success", async () => {
    const { service } = await setupService();
    pinger.whenUrlMatches(/health/, {
      ok: true,
      responseStatus: 200,
      responseBody: '{"status":"ok"}',
      requestTimeMs: 120,
    });

    const result = await sut.execute(service.getProps().id);

    expect(result.skipped).toBeUndefined();
    expect(result.healthCheck).toBeDefined();
    expect(result.healthCheck!.isError).toBe(false);
    expect(result.healthCheck!.responseStatus).toBe(200);

    const updated = await uow.repositories.services.getById(
      service.getProps().id,
    );
    expect(updated!.getProps().consecutivesIncidentDetectionFails).toBe(0);
    expect(updated!.getProps().status).toBe("CHECKING");
    expect(updated!.getProps().lastCheckedAt).not.toBeNull();
  });

  it("should resolve open incident and enqueue recovery notification on success", async () => {
    const { service } = await setupService();
    const incidentId = DefaultEntity.generateUUIDv7();
    const openIncident = Incident.create({
      serviceId: service.getProps().id,
      startedAt: new Date(Date.now() - 60000),
    });
    await uow.repositories.incidents.create(openIncident);

    const withIncident = service.setCurrentIncident(openIncident.getProps().id);
    await uow.repositories.services.update(withIncident);

    pinger.whenUrlMatches(/health/, {
      ok: true,
      responseStatus: 200,
    });

    const result = await sut.execute(withIncident.getProps().id);

    expect(result.incident).toBeDefined();
    expect(result.incident!.resolvedAt).not.toBeNull();

    const updated = await uow.repositories.services.getById(
      withIncident.getProps().id,
    );
    expect(updated!.getProps().currentIncidentId).toBeNull();
    expect(updated!.getProps().status).toBe("CHECKING");

    expect(notifications.enqueuedJobs).toHaveLength(1);
    expect(notifications.enqueuedJobs[0].type).toBe("incident-resolved");
    expect(notifications.enqueuedJobs[0].to).toBe("ops@example.com");
  });

  it("should increment fails on failure below threshold (no incident)", async () => {
    const { service } = await setupService({ incidentDetectionFails: 3 });
    pinger.whenUrlMatches(/health/, {
      ok: false,
      responseStatus: 500,
      timedOut: false,
    });

    const result = await sut.execute(service.getProps().id);

    expect(result.healthCheck).toBeDefined();
    expect(result.healthCheck!.isError).toBe(true);
    expect(result.healthCheck!.responseStatus).toBe(500);
    expect(result.incident).toBeUndefined();

    const updated = await uow.repositories.services.getById(
      service.getProps().id,
    );
    expect(updated!.getProps().consecutivesIncidentDetectionFails).toBe(1);
    expect(updated!.getProps().status).toBe("CHECKING");

    expect(notifications.enqueuedJobs).toHaveLength(0);
  });

  it("should create incident and enqueue alert when threshold is met", async () => {
    const { service } = await setupService({ incidentDetectionFails: 2 });
    pinger.whenUrlMatches(/health/, {
      ok: false,
      responseStatus: 500,
      timedOut: false,
    });

    await sut.execute(service.getProps().id);
    const result = await sut.execute(service.getProps().id);

    expect(result.incident).toBeDefined();
    expect(result.incident!.resolvedAt).toBeNull();
    expect(result.incident!.emailsSent).toBe(1);

    const updated = await uow.repositories.services.getById(
      service.getProps().id,
    );
    expect(updated!.getProps().status).toBe("INCIDENT");
    expect(updated!.getProps().currentIncidentId).toBe(
      result.incident!.id,
    );

    expect(notifications.enqueuedJobs).toHaveLength(1);
    expect(notifications.enqueuedJobs[0].type).toBe("incident-started");
    expect(notifications.enqueuedJobs[0].to).toBe("ops@example.com");
  });

  it("should not create a new incident when one is already open", async () => {
    const { service } = await setupService({ incidentDetectionFails: 1 });
    pinger.whenUrlMatches(/health/, {
      ok: false,
      responseStatus: 0,
      timedOut: true,
    });

    const first = await sut.execute(service.getProps().id);
    expect(first.incident).toBeDefined();

    const second = await sut.execute(service.getProps().id);

    expect(second.incident).toBeUndefined();

    const updated = await uow.repositories.services.getById(
      service.getProps().id,
    );
    expect(updated!.getProps().consecutivesIncidentDetectionFails).toBe(2);
    expect(updated!.getProps().currentIncidentId).toBe(
      first.incident!.id,
    );
    expect(updated!.getProps().status).toBe("INCIDENT");

    expect(notifications.enqueuedJobs).toHaveLength(1);
  });

  it("should skip when service is disabled", async () => {
    const { service } = await setupService();
    const disabled = service.disable();
    await uow.repositories.services.update(disabled);

    const result = await sut.execute(disabled.getProps().id);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("disabled");
    expect(result.healthCheck).toBeUndefined();

    const healthChecks = await uow.repositories.healthChecks.getByServiceId(
      disabled.getProps().id,
    );
    expect(healthChecks).toHaveLength(0);
  });

  it("should skip when service is not found", async () => {
    const result = await sut.execute("non-existent-id");

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("not-found");
    expect(result.healthCheck).toBeUndefined();
  });

  it("should not enqueue notification when emailToAlert is null", async () => {
    const { service } = await setupService({
      emailToAlert: null,
      incidentDetectionFails: 1,
    });
    pinger.whenUrlMatches(/health/, {
      ok: false,
      responseStatus: 500,
      timedOut: false,
    });

    const result = await sut.execute(service.getProps().id);

    expect(result.incident).toBeDefined();
    expect(notifications.enqueuedJobs).toHaveLength(0);
  });

  it("should record timeout correctly in healthcheck", async () => {
    const { service } = await setupService();
    pinger.whenUrlMatches(/health/, {
      ok: false,
      responseStatus: 0,
      timedOut: true,
      requestTimeMs: 10000,
    });

    const result = await sut.execute(service.getProps().id);

    expect(result.healthCheck!.timedOut).toBe(true);
    expect(result.healthCheck!.responseStatus).toBe(0);
    expect(result.healthCheck!.requestTime).toBe(10000);
  });

  it("should not fail the healthcheck when notification enqueue fails", async () => {
    const { service } = await setupService({ incidentDetectionFails: 1 });
    pinger.whenUrlMatches(/health/, {
      ok: false,
      responseStatus: 500,
      timedOut: false,
    });

    notifications.enqueue = async () => {
      throw new Error("queue down");
    };

    const result = await sut.execute(service.getProps().id);

    expect(result.incident).toBeDefined();
    expect(result.healthCheck).toBeDefined();
  });

  it("should clear orphaned currentIncidentId on success when incident is not found in DB", async () => {
    const { service } = await setupService();
    const fakeIncidentId = DefaultEntity.generateUUIDv7();
    const withOrphan = service.setCurrentIncident(fakeIncidentId);
    await uow.repositories.services.update(withOrphan);

    pinger.whenUrlMatches(/health/, {
      ok: true,
      responseStatus: 200,
    });

    const result = await sut.execute(withOrphan.getProps().id);

    expect(result.incident).toBeUndefined();
    expect(result.healthCheck).toBeDefined();

    const updated = await uow.repositories.services.getById(
      withOrphan.getProps().id,
    );
    expect(updated!.getProps().currentIncidentId).toBeNull();
    expect(updated!.getProps().status).toBe("CHECKING");
    expect(notifications.enqueuedJobs).toHaveLength(0);
  });
});
