import { describe, it, expect, beforeEach } from "vitest";
import { CreateService } from "./create-service";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import { createTestAdminUser, createTestDevUser } from "@utils/tests/user";
import { createTestOrganization } from "@utils/tests/organization";
import { createTestProject } from "@utils/tests/project";

let uow: IMUOW;
let sut: CreateService;

const serviceInput = {
  url: "https://api.example.com/health",
  name: "BackendService",
  intervalSeconds: 120,
  timeoutSeconds: 15,
  expectedResponseStatus: 204,
  incidentDetectionFails: 3,
  emailToAlert: "ops@example.com",
};

describe("Create Service", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new CreateService(uow);
  });

  it("should create a service inside a project when creator is admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);

    const result = await sut.execute(
      admin.getProps().id,
      project.getProps().id,
      serviceInput,
    );

    expect(result.service.getProps().id).toBeDefined();
  });

  it("should create a service with custom values", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);

    const result = await sut.execute(
      admin.getProps().id,
      project.getProps().id,
      {
        url: "https://api.example.com/health",
        name: "BackendService",
        intervalSeconds: 120,
        timeoutSeconds: 15,
        expectedResponseStatus: 204,
        incidentDetectionFails: 3,
        emailToAlert: "ops@example.com",
      },
    );

    expect(result.service.getProps()).toEqual(
      expect.objectContaining({
        intervalSeconds: 120,
        timeoutSeconds: 15,
        expectedResponseStatus: 204,
        incidentDetectionFails: 3,
        emailToAlert: "ops@example.com",
        enabled: true,
      }),
    );
  });

  it("should throw NotAllowedError when creator is not found", async () => {
    const { organization } = await createTestOrganization(uow);
    const { project } = await createTestProject(uow, organization);

    await expect(
      sut.execute("non-existent-user-id", project.getProps().id, serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when creator is not an admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: dev } = await createTestDevUser(uow, organization);
    const { project } = await createTestProject(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, project.getProps().id, serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotFoundError when project is not found", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    await expect(
      sut.execute(admin.getProps().id, "non-existent-project-id", serviceInput),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotAllowedError when project belongs to another organization", async () => {
    const { organization: organizationA } = await createTestOrganization(uow);
    const { organization: organizationB } = await createTestOrganization(uow, {
      name: "Other Corp",
    });

    const { user: adminA } = await createTestAdminUser(uow, organizationA);
    const { project: projectB } = await createTestProject(uow, organizationB);

    await expect(
      sut.execute(adminA.getProps().id, projectB.getProps().id, serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw LimitExceededError when project already has 10 services", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);

    for (let i = 1; i <= 10; i++) {
      await sut.execute(admin.getProps().id, project.getProps().id, {
        ...serviceInput,
        url: `https://api${i}.example.com/health`,
      });
    }

    await expect(
      sut.execute(admin.getProps().id, project.getProps().id, {
        ...serviceInput,
        url: "https://api11.example.com/health",
      }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });

});
