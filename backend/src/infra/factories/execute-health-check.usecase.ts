import { ExecuteHealthCheck } from "@domain/use-cases/execute-health-check";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { AxiosHttpPingerService } from "@infra/services/http-pinger";
import { BullMQNotificationsProducer } from "@infra/queue/notifications-producer";
import { notificationsQueue } from "@infra/queue/queues";

export function executeHealthCheckFactory() {
  const uow = new PrismaUOW(prismaClient);
  const pinger = new AxiosHttpPingerService();
  const notificationsProducer = new BullMQNotificationsProducer(notificationsQueue);
  const useCase = new ExecuteHealthCheck(uow, pinger, notificationsProducer);

  return { useCase };
}
