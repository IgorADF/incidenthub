import { ListIncidentsByService } from "@domain/use-cases/list-incidents-by-service";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listIncidentsByServiceFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new ListIncidentsByService(uow);

	return { useCase };
}
