import { Worker, Job } from "bullmq";
import { uuidv7 } from "uuidv7";
import { redisConnection } from "@infra/redis/connection";
import { healthcheckQueue, healthcheckDlqQueue } from "@infra/queue/queues";
import {
  HC_JOB_NAME,
  HealthcheckScheduler,
  TICK_JOB_NAME,
} from "@infra/queue/healthcheck-scheduler";
import { executeHealthCheckFactory } from "@infra/factories/execute-health-check.usecase";
import { repopulateSchedulesFactory } from "@infra/factories/repopulate-schedules.usecase";
import { ListAllDueServices } from "@domain/use-cases/list-all-due-services";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { prismaClient } from "@infra/db/prisma-client";
import { acquireLock, releaseLock } from "../shared/lock";
import { setupGracefulShutdown } from "../shared/shutdown";

const LOCK_TTL_MS = 30_000;

const scheduler = new HealthcheckScheduler(
  healthcheckQueue,
  new ListAllDueServices(new PrismaUOW(prismaClient)),
);

const worker = new Worker(
  "healthchecks",
  async (job: Job) => {
    if (job.name === TICK_JOB_NAME) {
      const result = await scheduler.processTick();
      return result;
    }

    if (job.name === HC_JOB_NAME) {
      const { serviceId } = job.data as { serviceId: string };
      const lockKey = `lock:service:${serviceId}`;
      const token = uuidv7();

      const acquired = await acquireLock(
        redisConnection,
        lockKey,
        token,
        LOCK_TTL_MS,
      );

      if (!acquired) {
        return { skipped: "locked" };
      }

      try {
        const { useCase } = executeHealthCheckFactory();
        const result = await useCase.execute(serviceId);
        return result;
      } finally {
        await releaseLock(redisConnection, lockKey, token);
      }
    }

    return { skipped: "unknown-job-type" };
  },
  {
    connection: redisConnection,
    concurrency: 50,
  },
);

worker.on("completed", (job) => {
  console.log(`[healthcheck] Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", async (job, err) => {
  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 1;

  console.error(
    `[healthcheck] Job ${job.id} (${job.name}) failed (attempt ${job.attemptsMade}/${maxAttempts}): ${err.message}`,
  );

  if (job.attemptsMade >= maxAttempts) {
    try {
      await healthcheckDlqQueue.add(
        job.name,
        { ...job.data, originalJobId: job.id, failedReason: err.message },
        { removeOnComplete: 100, removeOnFail: 500 },
      );
      console.error(`[healthcheck] Job ${job.id} forwarded to DLQ`);
    } catch (dlqErr) {
      console.error(
        `[healthcheck] Failed to forward job ${job.id} to DLQ:`,
        dlqErr instanceof Error ? dlqErr.message : dlqErr,
      );
    }
  }
});

worker.on("error", (err) => {
  console.error("[healthcheck] Worker error:", err.message);
});

async function main() {
  console.log("[healthcheck] Starting worker...");

  const { useCase } = repopulateSchedulesFactory();
  await useCase.execute();

  console.log("[healthcheck] Scheduler tick ensured, worker is running");
}

main().catch((err) => {
  console.error("[healthcheck] Failed to start:", err);
  process.exit(1);
});

setupGracefulShutdown([worker], redisConnection);
