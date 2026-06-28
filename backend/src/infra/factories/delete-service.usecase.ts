import { DeleteService } from "@domain/use-cases/delete-service";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function deleteServiceFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new DeleteService(uow);

	return { useCase };
}
