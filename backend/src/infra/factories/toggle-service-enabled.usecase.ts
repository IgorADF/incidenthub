import { ToggleServiceEnabled } from "@domain/use-cases/toggle-service-enabled";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function toggleServiceEnabledFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new ToggleServiceEnabled(uow);

  return { useCase };
}
