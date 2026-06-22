import type { Worker } from "bullmq";
import type { Redis } from "ioredis";

type Closeable = { close: () => Promise<void> };

export function setupGracefulShutdown(
  closeables: (Worker | Closeable)[],
  redis?: Redis,
): void {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[shutdown] Received ${signal}, closing workers...`);

    for (const closeable of closeables) {
      try {
        await closeable.close();
      } catch (error) {
        console.error("[shutdown] Error closing resource:", error);
      }
    }

    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        console.error("[shutdown] Error closing Redis:", error);
      }
    }

    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
