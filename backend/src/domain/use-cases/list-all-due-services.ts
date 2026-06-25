import { ServiceSchema } from "@domain/entities/service";
import { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";

export const ListAllDueServicesOutputSchema = z.object({
  services: z.array(
    z.object(ServiceSchema.shape).omit({
      consecutivesIncidentDetectionFails: true,
      lastCheckedAt: true,
    }),
  ),
});

export type ListAllDueServicesOutput = z.infer<
  typeof ListAllDueServicesOutputSchema
>;

export class ListAllDueServices {
  constructor(private readonly uow: UOW) {}

  async execute(now: Date = new Date()): Promise<ListAllDueServicesOutput> {
    const services = await this.uow.repositories.services.listAllDue(now);
    return ListAllDueServicesOutputSchema.parse({
      services: services.map((service) => service.getProps()),
    });
  }
}
