import { RepopulateSchedules } from "@domain/use-cases/repopulate-schedules";
import { ListAllDueServices } from "@domain/use-cases/list-all-due-services";
import { healthcheckQueue } from "@infra/queue/queues";
import { HealthcheckScheduler } from "@infra/queue/healthcheck-scheduler";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function repopulateSchedulesFactory() {
  const uow = new PrismaUOW(prismaClient);
  const listAllDueServices = new ListAllDueServices(uow);
  const scheduler = new HealthcheckScheduler(
    healthcheckQueue,
    listAllDueServices,
  );
  const useCase = new RepopulateSchedules(scheduler);

  return { useCase };
}
