import { describe, it, expect, beforeEach } from "vitest";
import { ListServicesByProject } from "./list-services-by-project";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { Service } from "@domain/entities/service";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestAdminUser } from "@domain/use-cases/utils/tests/user";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

let uow: IMUOW;
let sut: ListServicesByProject;

describe("List Services By Project", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new ListServicesByProject(uow);
  });

  it("should list all services for the given project", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);

    const serviceA = Service.create({
      projectId: project.getProps().id,
      url: "https://api-a.example.com/health",
      intervalSeconds: 120,
      timeoutSeconds: 15,
      expectedResponseStatus: 204,
      incidentDetectionFails: 3,
      emailToAlert: "ops@example.com",
      name: "BackendService",
    });

    const serviceB = Service.create({
      projectId: project.getProps().id,
      url: "https://api-b.example.com/health",
      intervalSeconds: 120,
      timeoutSeconds: 15,
      expectedResponseStatus: 204,
      incidentDetectionFails: 3,
      emailToAlert: "ops@example.com",
      name: "BackendService2",
    });

    await uow.repositories.services.create(serviceA);
    await uow.repositories.services.create(serviceB);

    const result = await sut.execute(
      user.getProps().organizationId,
      project.getProps().id,
    );

    expect(result.services).toHaveLength(2);
    expect(result.services.map((s) => s.getProps().url)).toEqual(
      expect.arrayContaining([
        "https://api-a.example.com/health",
        "https://api-b.example.com/health",
      ]),
    );
  });

  it("should not include services from other projects", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user } = await createTestAdminUser(uow, organization);

    const { project: projectA } = await createTestProject(uow, organization);
    const { project: projectB } = await createTestProject(uow, organization);

    const serviceA = Service.create({
      projectId: projectA.getProps().id,
      url: "https://api-a.example.com/health",
      intervalSeconds: 120,
      timeoutSeconds: 15,
      expectedResponseStatus: 204,
      incidentDetectionFails: 3,
      emailToAlert: "ops@example.com",
      name: "BackendService",
    });

    const serviceB = Service.create({
      projectId: projectB.getProps().id,
      url: "https://api-b.example.com/health",
      intervalSeconds: 120,
      timeoutSeconds: 15,
      expectedResponseStatus: 204,
      incidentDetectionFails: 3,
      emailToAlert: "ops@example.com",
      name: "BackendService2",
    });

    await uow.repositories.services.create(serviceA);
    await uow.repositories.services.create(serviceB);

    const result = await sut.execute(
      user.getProps().organizationId,
      projectA.getProps().id,
    );

    expect(result.services).toHaveLength(1);
    expect(result.services[0].getProps().url).toBe(
      "https://api-a.example.com/health",
    );
  });

  it("should return an empty array when project has no services", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);

    const result = await sut.execute(
      user.getProps().organizationId,
      project.getProps().id,
    );

    expect(result.services).toEqual([]);
  });

  it("should throw NotFoundError when project does not exist", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user } = await createTestAdminUser(uow, organization);

    await expect(
      sut.execute(user.getProps().organizationId, "non-existent-project-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotAllowedError when project belongs to another organization", async () => {
    const { organization: org1 } = await createTestOrganization(uow);
    const { organization: org2 } = await createTestOrganization(uow);
    const { user } = await createTestAdminUser(uow, org1);
    const { project: projectFromOrg2 } = await createTestProject(uow, org2);

    await expect(
      sut.execute(
        user.getProps().organizationId,
        projectFromOrg2.getProps().id,
      ),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
