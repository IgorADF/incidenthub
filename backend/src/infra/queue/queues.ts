import { Queue } from "bullmq";
import { redisConnection } from "@infra/redis/connection";

export const healthcheckQueue = new Queue("healthchecks", {
  connection: redisConnection,
});

export const healthcheckDlqQueue = new Queue("healthchecks-dlq", {
  connection: redisConnection,
});

export const notificationsQueue = new Queue("notifications", {
  connection: redisConnection,
});

export const notificationsDlqQueue = new Queue("notifications-dlq", {
  connection: redisConnection,
});
