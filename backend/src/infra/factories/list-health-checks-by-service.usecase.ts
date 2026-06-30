import { ListHealthChecksByService } from "@domain/use-cases/list-health-checks-by-service";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listHealthChecksByServiceFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new ListHealthChecksByService(uow);

	return { useCase };
}
