import { Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ maxRetriesPerRequest: null });

interface HealthcheckJobData {
  clientId: string;
  url: string;
}

const worker = new Worker<HealthcheckJobData>(
  "healthchecks",
  async (job: Job<HealthcheckJobData>) => {
    const { clientId, url } = job.data;
    const start = Date.now();

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000), // timeout de 10s
      });

      const latencyMs = Date.now() - start;

      await saveResult({
        clientId,
        status: res.ok ? "up" : "degraded",
        statusCode: res.status,
        latencyMs,
        checkedAt: new Date(),
      });
    } catch (err) {
      await saveResult({
        clientId,
        status: "down",
        error: (err as Error).message,
        checkedAt: new Date(),
      });
    }
  },
  {
    connection,
    concurrency: 50, // 50 chamadas HTTP simultâneas por worker
  },
);
