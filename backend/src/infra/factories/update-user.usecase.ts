import { UpdateUser } from "@domain/use-cases/update-user";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function updateUserFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new UpdateUser(uow);

	return { useCase };
}
