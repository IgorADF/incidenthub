import { Queue } from "bullmq";
import { redisConnection } from "@infra/redis/connection";

export const healthcheckQueue = new Queue("healthchecks", {
  connection: redisConnection,
});

export const dlqHealthcheckQueue = new Queue("dlqhealthchecks", {
  connection: redisConnection,
});
