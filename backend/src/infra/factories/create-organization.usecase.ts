import { CreateOrganization } from "@domain/use-cases/create-organization";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function createOrganizationFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const hashPasswordService = new HashPasswordService();
	const useCase = new CreateOrganization(uow, hashPasswordService);

	return { useCase };
}
