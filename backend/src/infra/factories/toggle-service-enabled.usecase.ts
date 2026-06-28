import { ToggleServiceEnabled } from "@domain/use-cases/toggle-service-enabled";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function toggleServiceEnabledFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const useCase = new ToggleServiceEnabled(uow);

	return { useCase };
}
