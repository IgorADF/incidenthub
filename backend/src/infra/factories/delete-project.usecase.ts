import { DeleteProject } from "@domain/use-cases/delete-project";
import { DeleteService } from "@domain/use-cases/delete-service";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function deleteProjectFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const deleteService = new DeleteService(uow);
	const useCase = new DeleteProject(uow, deleteService);

	return { useCase };
}