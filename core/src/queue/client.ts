// healthcheck.queue.ts
import { Queue } from "bullmq";
import { redisConnection } from "../redis/connection";

export const healthcheckQueue = new Queue("healthchecks", {
  connection: redisConnection,
});

export async function registerClient(client: {
  id: string;
  url: string;
  intervalMs: number; // 30_000 | 60_000 | 300_000
}) {
  await healthcheckQueue.add(
    `healthcheck:${client.id}`, // nome único por cliente
    { clientId: client.id, url: client.url },
    {
      repeat: { every: client.intervalMs },
      removeOnComplete: { count: 10 }, // mantém apenas últimas 10 execuções
      removeOnFail: { count: 50 },
    },
  );
}

export async function unregisterClient(clientId: string, intervalMs: number) {
  await healthcheckQueue.removeRepeatable(`healthcheck:${clientId}`, {
    every: intervalMs,
  });
}
