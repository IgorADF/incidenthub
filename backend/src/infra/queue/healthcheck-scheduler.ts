import type { SchedulerInterface } from "@domain/services/scheduler.interface";
import type { ListAllDueServices } from "@domain/use-cases/list-all-due-services";
import type { Queue } from "bullmq";

const TICK_SCHEDULER_ID = "healthcheck-tick";
const TICK_INTERVAL_MS = 5000;
export const TICK_JOB_NAME = "healthcheck:tick";
export const HC_JOB_NAME = "healthcheck";

export class HealthcheckScheduler implements SchedulerInterface {
	constructor(
		private readonly queue: Queue,
		private readonly listAllDueServices: ListAllDueServices,
	) {}

	async ensureTickExists(): Promise<void> {
		await this.queue.upsertJobScheduler(
			TICK_SCHEDULER_ID,
			{ every: TICK_INTERVAL_MS },
			{
				name: TICK_JOB_NAME,
				data: {},
				opts: {
					removeOnComplete: 10,
					removeOnFail: 50,
				},
			},
		);
	}

	async removeTick(): Promise<void> {
		await this.queue.removeJobScheduler(TICK_SCHEDULER_ID);
	}

	async processTick(): Promise<{ enqueued: number }> {
		const { services: due } = await this.listAllDueServices.execute();

		for (const service of due) {
			await this.queue.add(
				HC_JOB_NAME,
				{ serviceId: service.id },
				{
					jobId: `healthcheck:${service.id}`,
					attempts: 3,
					backoff: { type: "exponential", delay: 2000 },
					removeOnComplete: 10,
					removeOnFail: 50,
				},
			);
		}

		return { enqueued: due.length };
	}
}
