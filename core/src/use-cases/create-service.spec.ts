import { describe, it, expect, beforeEach } from "vitest";
import { CreateService } from "./create-service";
import { IMUOW } from "../repositories/in-memory/_uow";
import {
  createAdminUser,
  createDevUser,
  createOrganization,
  createProject,
} from "../utils/test-factories";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: CreateService;

const serviceInput = {
  url: "https://api.example.com/health",
};

describe("Create Service", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new CreateService(uow);
  });

  it("should create a service inside a project when creator is admin", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");
    const project = await createProject(uow, organization, "Incident Hub");

    const result = await sut.execute(
      admin.getProps().id,
      project.getProps().id,
      serviceInput,
    );

    expect(result.service.getProps()).toEqual(
      expect.objectContaining({
        projectId: project.getProps().id,
        url: serviceInput.url,
        status: "unknown",
        intervalSeconds: 60,
        timeoutSeconds: 30,
        expectedResponseStatus: 200,
        incidentDetectionFails: 1,
        consecutivesIncidentDetectionFails: 0,
        enabled: true,
        emailToAlert: null,
      }),
    );
    expect(result.service.getProps().id).toBeDefined();
  });

  it("should create a service with custom values", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");
    const project = await createProject(uow, organization, "Incident Hub");

    const result = await sut.execute(admin.getProps().id, project.getProps().id, {
      url: "https://api.example.com/health",
      intervalSeconds: 120,
      timeoutSeconds: 15,
      expectedResponseStatus: 204,
      incidentDetectionFails: 3,
      emailToAlert: "ops@example.com",
      enabled: false,
    });

    expect(result.service.getProps()).toEqual(
      expect.objectContaining({
        intervalSeconds: 120,
        timeoutSeconds: 15,
        expectedResponseStatus: 204,
        incidentDetectionFails: 3,
        emailToAlert: "ops@example.com",
        enabled: false,
      }),
    );
  });

  it("should throw NotAllowedError when creator is not found", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const project = await createProject(uow, organization, "Incident Hub");

    await expect(
      sut.execute("non-existent-user-id", project.getProps().id, serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when creator is not an admin", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const dev = await createDevUser(uow, organization, "dev@acme.com");
    const project = await createProject(uow, organization, "Incident Hub");

    await expect(
      sut.execute(dev.getProps().id, project.getProps().id, serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when project is not found", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

    await expect(
      sut.execute(admin.getProps().id, "non-existent-project-id", serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when project belongs to another organization", async () => {
    const organizationA = await createOrganization(uow, "Acme Corp");
    const organizationB = await createOrganization(uow, "Other Corp");
    const adminA = await createAdminUser(uow, organizationA, "admin@acme.com");
    const projectB = await createProject(uow, organizationB, "Other Project");

    await expect(
      sut.execute(adminA.getProps().id, projectB.getProps().id, serviceInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw LimitExceededError when project already has 10 services", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");
    const project = await createProject(uow, organization, "Incident Hub");

    for (let i = 1; i <= 10; i++) {
      await sut.execute(admin.getProps().id, project.getProps().id, {
        url: `https://api${i}.example.com/health`,
      });
    }

    await expect(
      sut.execute(admin.getProps().id, project.getProps().id, {
        url: "https://api11.example.com/health",
      }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });
});
