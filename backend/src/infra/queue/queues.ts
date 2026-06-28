import { redisConnection } from "@infra/redis/connection";
import { Queue } from "bullmq";

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
