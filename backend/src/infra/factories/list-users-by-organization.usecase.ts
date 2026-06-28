import { ListUsersByOrganization } from "@domain/use-cases/list-users-by-organization";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listUsersByOrganizationFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new ListUsersByOrganization(uow);

	return { useCase };
}
