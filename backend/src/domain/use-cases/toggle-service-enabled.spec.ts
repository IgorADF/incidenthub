import { describe, it, expect, beforeEach } from "vitest";
import { ToggleServiceEnabled } from "./toggle-service-enabled";
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

let uow: IMUOW;
let sut: ToggleServiceEnabled;

describe("ToggleServiceEnabled", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new ToggleServiceEnabled(uow);
  });

  async function setup() {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    const { project } = await createTestProject(uow, organization);
    const { service } = await createTestService(uow, project);
    return { organization, admin, project, service };
  }

  it("should disable an enabled service when admin", async () => {
    const { admin, service } = await setup();

    const result = await sut.execute(admin.getProps().id, service.getProps().id, false);

    expect(result.service.getProps().enabled).toBe(false);
    expect(result.service.getProps().status).toBe("DISABLED");
  });

  it("should enable a disabled service when admin", async () => {
    const { admin, service } = await setup();
    const disabled = service.disable();
    await uow.repositories.services.update(disabled);

    const result = await sut.execute(admin.getProps().id, disabled.getProps().id, true);

    expect(result.service.getProps().enabled).toBe(true);
    expect(result.service.getProps().status).toBe("CHECKING");
  });

  it("should throw NotAllowedError when updater is not admin", async () => {
    const { organization, service } = await setup();
    const { user: dev } = await createTestDevUser(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, service.getProps().id, false),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotFoundError when service does not exist", async () => {
    const { admin } = await setup();

    await expect(
      sut.execute(admin.getProps().id, "non-existent-id", false),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotAllowedError when service belongs to another organization", async () => {
    const { service } = await setup();

    const { organization: orgB } = await createTestOrganization(uow, {
      name: "Other Corp",
    });
    const { user: adminB } = await createTestAdminUser(uow, orgB);

    await expect(
      sut.execute(adminB.getProps().id, service.getProps().id, false),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });
});
