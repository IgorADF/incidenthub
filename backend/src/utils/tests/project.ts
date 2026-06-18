import { Organization } from "@domain/entities/organization";
import { CreateProjectType, Project } from "@domain/entities/project";
import { IMUOW } from "@domain/repositories/in-memory/_uow";

export async function createTestProject(
  uow: IMUOW,
  organization: Organization,
  data?: Partial<CreateProjectType>,
) {
  const projectCreationData: CreateProjectType = {
    name: "Project Name",
    showPublicPage: true,
    organizationId: organization.getProps().id,
    publicPageSlug: "this-is-project-slug",

    ...data,
  };

  const project = Project.create(projectCreationData);

  await uow.repositories.projects.create(project);
  return { project, creationData: projectCreationData };
}
