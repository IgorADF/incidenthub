import { Project } from "@domain/entities/project";
import { CreateServiceType, Service } from "@domain/entities/service";
import { IMUOW } from "@domain/repositories/in-memory/_uow";

export async function createTestService(
  uow: IMUOW,
  project: Project,
  data?: Partial<CreateServiceType>,
) {
  const serviceCreationData: CreateServiceType = {
    name: "Test Service",
    url: "https://api.example.com/health",
    intervalSeconds: 60,
    timeoutSeconds: 10,
    expectedResponseStatus: 200,
    incidentDetectionFails: 3,
    emailToAlert: "ops@example.com",
    projectId: project.getProps().id,
    ...data,
  };

  const service = Service.create(serviceCreationData);
  await uow.repositories.services.create(service);

  return { service, creationData: serviceCreationData };
}
