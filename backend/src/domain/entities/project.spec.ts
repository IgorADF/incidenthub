import { describe, it, expect } from "vitest";
import { Project } from "./project";
import { ValidationEntitiesError } from "./errors/ValidationEntitiesError";
import { DefaultEntity } from "./_default";

const baseProject = {
  organizationId: DefaultEntity.generateUUIDv7(),
  name: "Incident Hub",
  showPublicPage: false,
  publicPageSlug: null,
};

describe("Project entity", () => {
  it("should create a project with valid props", () => {
    const project = Project.create(baseProject);

    expect(project.getProps().name).toBe("Incident Hub");
    expect(project.getProps().showPublicPage).toBe(false);
    expect(project.getProps().publicPageSlug).toBeNull();
  });

  it("should create a project with public page enabled and a valid slug", () => {
    const project = Project.create({
      ...baseProject,
      showPublicPage: true,
      publicPageSlug: "incident-hub",
    });

    expect(project.getProps().showPublicPage).toBe(true);
    expect(project.getProps().publicPageSlug).toBe("incident-hub");
  });

  it("should accept a name with exactly 1 character", () => {
    expect(() => Project.create({ ...baseProject, name: "A" })).not.toThrow();
  });

  it("should accept a name with exactly 50 characters", () => {
    expect(() =>
      Project.create({ ...baseProject, name: "a".repeat(50) }),
    ).not.toThrow();
  });

  it("should reject an empty name", () => {
    expect(() => Project.create({ ...baseProject, name: "" })).toThrow(
      ValidationEntitiesError,
    );
  });

  it("should reject a name longer than 50 characters", () => {
    expect(() =>
      Project.create({ ...baseProject, name: "a".repeat(51) }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject showPublicPage true without a slug", () => {
    expect(() =>
      Project.create({ ...baseProject, showPublicPage: true }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should reject an invalid public page slug", () => {
    expect(() =>
      Project.create({
        ...baseProject,
        showPublicPage: true,
        publicPageSlug: "Invalid Slug",
      }),
    ).toThrow(ValidationEntitiesError);
  });

  it("should strip a leading slash from the slug", () => {
    const project = Project.create({
      ...baseProject,
      showPublicPage: true,
      publicPageSlug: "/incident-hub",
    });

    expect(project.getProps().publicPageSlug).toBe("incident-hub");
  });
});
