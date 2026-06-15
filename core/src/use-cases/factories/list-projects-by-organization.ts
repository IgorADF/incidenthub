import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { ListProjectsByOrganization } from "../list-projects-by-organization";

export function listProjectsByOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new ListProjectsByOrganization(uow);

  return { useCase };
}
