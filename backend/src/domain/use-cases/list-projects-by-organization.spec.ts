import { describe, it, expect, beforeEach } from "vitest";
import { ListProjectsByOrganization } from "./list-projects-by-organization";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";

let uow: IMUOW;
let sut: ListProjectsByOrganization;

describe("List Projects By Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new ListProjectsByOrganization(uow);
  });

  it("should list all projects for the organization", async () => {
    const { organization } = await createTestOrganization(uow);
    const { project: projectA } = await createTestProject(uow, organization, {
      name: "Project A",
    });
    const { project: projectB } = await createTestProject(uow, organization, {
      name: "Project B",
      showPublicPage: false,
    });

    const result = await sut.execute(organization.getProps().id);

    expect(result.projects).toHaveLength(2);
    expect(result.projects.map((p) => p.getProps().name)).toEqual(
      expect.arrayContaining(["Project A", "Project B"]),
    );
    expect(result.projects[0].getProps().organizationId).toBe(
      organization.getProps().id,
    );
    expect(result.projects[1].getProps().organizationId).toBe(
      organization.getProps().id,
    );
  });

  it("should return an empty array when organization has no projects", async () => {
    const { organization } = await createTestOrganization(uow);
    const result = await sut.execute(organization.getProps().id);
    expect(result.projects).toEqual([]);
  });

  it("should not include projects from other organizations", async () => {
    const { organization: organizationA } = await createTestOrganization(uow);
    const { organization: organizationB } = await createTestOrganization(uow, {
      name: "Other Corp",
    });

    await createTestProject(uow, organizationA, { name: "Project A" });
    await createTestProject(uow, organizationB, { name: "Project B" });

    const result = await sut.execute(organizationA.getProps().id);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].getProps().name).toBe("Project A");
  });
});
