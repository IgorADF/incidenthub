import { UpdateProject } from "@domain/use-cases/update-project";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function updateProjectFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new UpdateProject(uow);

	return { useCase };
}
