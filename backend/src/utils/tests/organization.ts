import {
  CreateOrganizationType,
  Organization,
} from "@domain/entities/organization";
import { IMUOW } from "@domain/repositories/in-memory/_uow";

export async function createTestOrganization(
  uow: IMUOW,
  data?: CreateOrganizationType,
) {
  const organizationCreationData: CreateOrganizationType = {
    name: "Dev Corporation",
    ...data,
  };

  const organization = Organization.create(organizationCreationData);
  await uow.repositories.organizations.create(organization);

  return { organization, creationData: organizationCreationData };
}
