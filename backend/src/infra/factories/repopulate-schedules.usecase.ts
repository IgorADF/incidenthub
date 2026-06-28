import { ListAllDueServices } from "@domain/use-cases/list-all-due-services";
import { RepopulateSchedules } from "@domain/use-cases/repopulate-schedules";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { HealthcheckScheduler } from "@infra/queue/healthcheck-scheduler";
import { healthcheckQueue } from "@infra/queue/queues";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function repopulateSchedulesFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const listAllDueServices = new ListAllDueServices(uow);
	const scheduler = new HealthcheckScheduler(
		healthcheckQueue,
		listAllDueServices,
	);
	const useCase = new RepopulateSchedules(scheduler);

	return { useCase };
}
