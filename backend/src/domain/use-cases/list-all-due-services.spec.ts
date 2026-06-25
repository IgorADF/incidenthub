import { describe, it, expect, beforeEach } from "vitest";
import { ListAllDueServices } from "./list-all-due-services";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestService } from "@domain/use-cases/utils/tests/service";

let uow: IMUOW;
let sut: ListAllDueServices;

describe("ListAllDueServices", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new ListAllDueServices(uow);
  });

  it("should return services that have never been checked", async () => {
    const { organization } = await createTestOrganization(uow);
    const { project } = await createTestProject(uow, organization);
    await createTestService(uow, project, { name: "Service A" });

    const { services } = await sut.execute(new Date());

    expect(services).toHaveLength(1);
    expect(services[0].name).toBe("Service A");
    expect(services[0]).not.toHaveProperty("lastCheckedAt");
    expect(services[0]).not.toHaveProperty(
      "consecutivesIncidentDetectionFails",
    );
  });

  it("should return services whose interval has elapsed since last check", async () => {
    const { organization } = await createTestOrganization(uow);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project, {
      intervalSeconds: 60,
    });

    const checked = service.markCheckedAt(new Date(Date.now() - 120_000));
    await uow.repositories.services.update(checked);

    const { services } = await sut.execute(new Date());

    expect(services).toHaveLength(1);
  });

  it("should not return services whose interval has not elapsed", async () => {
    const { organization } = await createTestOrganization(uow);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project, {
      intervalSeconds: 60,
    });

    const checked = service.markCheckedAt(new Date());
    await uow.repositories.services.update(checked);

    const { services } = await sut.execute(new Date());

    expect(services).toHaveLength(0);
  });

  it("should not return disabled services", async () => {
    const { organization } = await createTestOrganization(uow);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project);
    const disabled = service.disable();
    await uow.repositories.services.update(disabled);

    const { services } = await sut.execute(new Date());

    expect(services).toHaveLength(0);
  });

  it("should return empty array when no services exist", async () => {
    const { services } = await sut.execute(new Date());

    expect(services).toEqual([]);
  });
});
