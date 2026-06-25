import { SchedulerInterface } from "@domain/services/scheduler.interface";
import z from "zod";

export const RepopulateSchedulesOutputSchema = z.object({
  repopulated: z.boolean(),
});

export type RepopulateSchedulesOutput = z.infer<
  typeof RepopulateSchedulesOutputSchema
>;

export class RepopulateSchedules {
  constructor(private readonly scheduler: SchedulerInterface) {}

  async execute(): Promise<RepopulateSchedulesOutput> {
    await this.scheduler.ensureTickExists();
    return RepopulateSchedulesOutputSchema.parse({ repopulated: true });
  }
}
