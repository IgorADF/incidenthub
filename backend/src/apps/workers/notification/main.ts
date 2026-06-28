import type { NotificationJobData } from "@domain/services/notifications-producer.interface";
import { notificationsDlqQueue, notificationsQueue } from "@infra/queue/queues";
import { redisConnection } from "@infra/redis/connection";
import { EmailService } from "@infra/services/email";
import { type Job, Worker } from "bullmq";
import { setupGracefulShutdown } from "../shared/shutdown";

const emailService = new EmailService();

const worker = new Worker(
	"notifications",
	async (job: Job<NotificationJobData>) => {
		const { to, subject, body } = job.data;

		await emailService.sendEmail({ to, subject, body });

		return { sent: true };
	},
	{
		connection: redisConnection,
		concurrency: 10,
	},
);

worker.on("completed", (job) => {
	console.log(
		`[notification] Job ${job.id} (${job.data.type}) completed → ${job.data.to}`,
	);
});

worker.on("failed", async (job, err) => {
	if (!job) return;

	const maxAttempts = job.opts.attempts ?? 1;

	console.error(
		`[notification] Job ${job.id} (${job.data.type}) failed (attempt ${job.attemptsMade}/${maxAttempts}): ${err.message}`,
	);

	if (job.attemptsMade >= maxAttempts) {
		try {
			await notificationsDlqQueue.add(
				job.name,
				{ ...job.data, originalJobId: job.id, failedReason: err.message },
				{ removeOnComplete: 100, removeOnFail: 500 },
			);
			console.error(`[notification] Job ${job.id} forwarded to DLQ`);
		} catch (dlqErr) {
			console.error(
				`[notification] Failed to forward job ${job.id} to DLQ:`,
				dlqErr instanceof Error ? dlqErr.message : dlqErr,
			);
		}
	}
});

worker.on("error", (err) => {
	console.error("[notification] Worker error:", err.message);
});

console.log("[notification] Worker is running");

setupGracefulShutdown([worker], redisConnection);
