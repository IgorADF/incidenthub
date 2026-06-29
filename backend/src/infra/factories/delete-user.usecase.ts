import { DeleteUser } from "@domain/use-cases/delete-user";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function deleteUserFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new DeleteUser(uow);

	return { useCase };
}