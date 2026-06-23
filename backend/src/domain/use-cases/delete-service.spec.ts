import { describe, it, expect, beforeEach } from "vitest";
import { DeleteService } from "./delete-service";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import {
  createTestAdminUser,
  createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestService } from "@domain/use-cases/utils/tests/service";
import { Incident } from "@domain/entities/incident";
import { HealthCheck } from "@domain/entities/health-check";

let uow: IMUOW;
let sut: DeleteService;

describe("DeleteService", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new DeleteService(uow);
  });

  async function setup() {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project);
    return { organization, admin, project, service };
  }

  it("should delete a service when deleter is admin", async () => {
    const { admin, service } = await setup();

    const result = await sut.execute(admin.getProps().id, service.getProps().id);

    expect(result.deleted).toBe(true);

    const found = await uow.repositories.services.getById(service.getProps().id);
    expect(found).toBeNull();
  });

  it("should throw NotAllowedError when deleter is not admin", async () => {
    const { organization, service } = await setup();
    const { user: dev } = await createTestDevUser(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, service.getProps().id),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotFoundError when service does not exist", async () => {
    const { admin } = await setup();

    await expect(
      sut.execute(admin.getProps().id, "non-existent-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotAllowedError when service belongs to another organization", async () => {
    const { service } = await setup();

    const { organization: orgB } = await createTestOrganization(uow, {
      name: "Other Corp",
    });
    const { user: adminB } = await createTestAdminUser(uow, orgB);

    await expect(
      sut.execute(adminB.getProps().id, service.getProps().id),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should delete all healthchecks for the service", async () => {
    const { admin, service } = await setup();

    const healthCheck = HealthCheck.create({
      serviceId: service.getProps().id,
      url: "https://api.example.com/health",
      requestTime: 100,
      isError: false,
      timedOut: false,
      responseStatus: 200,
      responseJsonData: null,
    });
    await uow.repositories.healthChecks.create(healthCheck);

    await sut.execute(admin.getProps().id, service.getProps().id);

    const remaining = await uow.repositories.healthChecks.getByServiceId(
      service.getProps().id,
    );
    expect(remaining).toHaveLength(0);
  });

  it("should delete all incidents for the service", async () => {
    const { admin, service } = await setup();

    const incident = Incident.create({
      serviceId: service.getProps().id,
      startedAt: new Date(),
    });
    await uow.repositories.incidents.create(incident);

    await sut.execute(admin.getProps().id, service.getProps().id);

    const remaining = await uow.repositories.incidents.getByServiceId(
      service.getProps().id,
    );
    expect(remaining).toHaveLength(0);
  });

  it("should delete service with currentIncidentId and its incidents", async () => {
    const { admin, service } = await setup();

    const incident = Incident.create({
      serviceId: service.getProps().id,
      startedAt: new Date(),
    });
    await uow.repositories.incidents.create(incident);

    const withIncident = service.setCurrentIncident(incident.getProps().id);
    await uow.repositories.services.update(withIncident);

    await sut.execute(admin.getProps().id, withIncident.getProps().id);

    const foundService = await uow.repositories.services.getById(
      withIncident.getProps().id,
    );
    expect(foundService).toBeNull();

    const remainingIncidents = await uow.repositories.incidents.getByServiceId(
      service.getProps().id,
    );
    expect(remainingIncidents).toHaveLength(0);
  });
});
