import { describe, it, expect, beforeEach } from "vitest";
import { ListServicesByProject } from "./list-services-by-project";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createOrganization, createProject } from "@utils/test-factories";
import { Service } from "@domain/entities/service";

let uow: IMUOW;
let sut: ListServicesByProject;

describe("List Services By Project", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new ListServicesByProject(uow);
  });

  it("should list all services for the given project", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const project = await createProject(uow, organization, "Incident Hub");
    const serviceA = Service.create({
      projectId: project.getProps().id,
      url: "https://api-a.example.com/health",
    });
    const serviceB = Service.create({
      projectId: project.getProps().id,
      url: "https://api-b.example.com/health",
    });
    await uow.repositories.services.create(serviceA);
    await uow.repositories.services.create(serviceB);

    const result = await sut.execute(project.getProps().id.value);

    expect(result.services).toHaveLength(2);
    expect(result.services.map((s) => s.getProps().url)).toEqual(
      expect.arrayContaining([
        "https://api-a.example.com/health",
        "https://api-b.example.com/health",
      ]),
    );
  });

  it("should not include services from other projects", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const projectA = await createProject(uow, organization, "Project A");
    const projectB = await createProject(uow, organization, "Project B");
    const serviceA = Service.create({
      projectId: projectA.getProps().id,
      url: "https://api-a.example.com/health",
    });
    const serviceB = Service.create({
      projectId: projectB.getProps().id,
      url: "https://api-b.example.com/health",
    });
    await uow.repositories.services.create(serviceA);
    await uow.repositories.services.create(serviceB);

    const result = await sut.execute(projectA.getProps().id.value);

    expect(result.services).toHaveLength(1);
    expect(result.services[0].getProps().url).toBe(
      "https://api-a.example.com/health",
    );
  });

  it("should return an empty array when project has no services", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const project = await createProject(uow, organization, "Incident Hub");

    const result = await sut.execute(project.getProps().id.value);

    expect(result.services).toEqual([]);
  });

  it("should return an empty array when project does not exist", async () => {
    const result = await sut.execute("non-existent-project-id");

    expect(result.services).toEqual([]);
  });
});
