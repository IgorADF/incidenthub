import { Queue } from "bullmq";
import {
  NotificationJobData,
  NotificationsProducerInterface,
} from "@domain/services/notifications-producer.interface";

export class BullMQNotificationsProducer
  implements NotificationsProducerInterface
{
  constructor(private readonly queue: Queue) {}

  async enqueue(data: NotificationJobData): Promise<void> {
    const jobId = data.incidentId
      ? `notification:${data.type}:${data.incidentId}`
      : undefined;

    await this.queue.add("notification", data, {
      jobId,
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }
}
