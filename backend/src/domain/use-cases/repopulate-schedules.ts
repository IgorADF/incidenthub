import { SchedulerInterface } from "@domain/services/scheduler.interface";

export class RepopulateSchedules {
  constructor(private readonly scheduler: SchedulerInterface) {}

  async execute() {
    await this.scheduler.ensureTickExists();
    return { repopulated: true };
  }
}
