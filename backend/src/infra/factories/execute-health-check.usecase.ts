import { ExecuteHealthCheck } from "@domain/use-cases/execute-health-check";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { BullMQNotificationsProducer } from "@infra/queue/notifications-producer";
import { notificationsQueue } from "@infra/queue/queues";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { AxiosHttpPingerService } from "@infra/services/http-pinger";

export function executeHealthCheckFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const pinger = new AxiosHttpPingerService();
	const notificationsProducer = new BullMQNotificationsProducer(
		notificationsQueue,
	);
	const useCase = new ExecuteHealthCheck(uow, pinger, notificationsProducer);

	return { useCase };
}
