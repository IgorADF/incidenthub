import { describe, it, expect, beforeEach } from "vitest";
import { UpdateService } from "./update-service";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import { ValidationEntitiesError } from "@domain/entities/errors/ValidationEntitiesError";
import {
  createTestAdminUser,
  createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestService } from "@domain/use-cases/utils/tests/service";

let uow: IMUOW;
let sut: UpdateService;

const updateInput = {
  name: "Updated Service",
  url: "https://api.updated.com/health",
  intervalSeconds: 300,
  timeoutSeconds: 10,
  expectedResponseStatus: 200,
  incidentDetectionFails: 5,
  emailToAlert: "newops@example.com",
};

describe("UpdateService", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new UpdateService(uow);
  });

  async function setup() {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project);
    const disabled = service.disable();
    await uow.repositories.services.update(disabled);
    return { organization, admin, project, service: disabled };
  }

  it("should update a disabled service when updater is admin", async () => {
    const { admin, service } = await setup();

    const result = await sut.execute(
      admin.getProps().id,
      service.getProps().id,
      updateInput,
    );

    expect(result.service.getProps().name).toBe("Updated Service");
    expect(result.service.getProps().url).toBe("https://api.updated.com/health");
    expect(result.service.getProps().intervalSeconds).toBe(300);
  });

  it("should throw NotAllowedError when service is enabled", async () => {
    const { admin, service } = await setup();
    const enabled = service.enable();
    await uow.repositories.services.update(enabled);

    await expect(
      sut.execute(admin.getProps().id, enabled.getProps().id, updateInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when updater is not admin", async () => {
    const { organization, service } = await setup();
    const { user: dev } = await createTestDevUser(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, service.getProps().id, updateInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotFoundError when service does not exist", async () => {
    const { admin } = await setup();

    await expect(
      sut.execute(admin.getProps().id, "non-existent-id", updateInput),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotAllowedError when service belongs to another organization", async () => {
    const { admin, service } = await setup();

    const { organization: orgB } = await createTestOrganization(uow, {
      name: "Other Corp",
    });
    const { user: adminB } = await createTestAdminUser(uow, orgB);

    await expect(
      sut.execute(adminB.getProps().id, service.getProps().id, updateInput),
    ).rejects.toBeInstanceOf(NotAllowedError);

    const result = await sut.execute(
      admin.getProps().id,
      service.getProps().id,
      updateInput,
    );
    expect(result).toBeDefined();
  });

  it("should preserve fields not included in the update", async () => {
    const { admin, service } = await setup();

    const result = await sut.execute(
      admin.getProps().id,
      service.getProps().id,
      { name: "Only Name Changed" },
    );

    expect(result.service.getProps().name).toBe("Only Name Changed");
    expect(result.service.getProps().url).toBe(service.getProps().url);
    expect(result.service.getProps().intervalSeconds).toBe(
      service.getProps().intervalSeconds,
    );
  });

  it("should set emailToAlert to null when explicitly passed", async () => {
    const { admin, service } = await setup();

    const result = await sut.execute(
      admin.getProps().id,
      service.getProps().id,
      { emailToAlert: null },
    );

    expect(result.service.getProps().emailToAlert).toBeNull();
  });

  it("should reject invalid update values via entity validation", async () => {
    const { admin, service } = await setup();

    await expect(
      sut.execute(admin.getProps().id, service.getProps().id, {
        intervalSeconds: 3,
      }),
    ).rejects.toBeInstanceOf(ValidationEntitiesError);
  });
});
